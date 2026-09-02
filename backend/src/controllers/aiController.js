const { SystemSetting, Transaction, Category, AccountBook, Item } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// 获取 AI 配置
async function getAIConfig() {
  const keys = ['ai_api_key', 'ai_base_url', 'ai_model', 'ai_system_prompt'];
  const settings = await SystemSetting.findAll({ where: { key: keys } });
  const config = {};
  settings.forEach(s => { config[s.key] = s.value; });
  return {
    apiKey: config.ai_api_key || '',
    baseUrl: config.ai_base_url || 'https://api.deepseek.com',
    model: config.ai_model || 'deepseek-chat',
    systemPrompt: config.ai_system_prompt || '你是一个家庭管家AI助手，帮助用户管理家庭事务、记账、物品管理、菜谱推荐等。请用简洁友好的中文回答。'
  };
}

// 获取用户的分类列表（用于 AI 匹配）
async function getUserCategories(familyId) {
  const where = { [Op.or]: [{ builtIn: true }] };
  if (familyId) where[Op.or].push({ familyId });
  const cats = await Category.findAll({ where, attributes: ['id', 'name', 'type', 'parentId'], raw: true });
  return cats;
}

// 获取用户的账本列表
async function getUserBooks(userId, familyId) {
  const where = { status: 'active' };
  if (familyId) where[Op.or] = [{ familyId }, { userId, type: 'personal' }];
  else where.userId = userId;
  const books = await AccountBook.findAll({ where, attributes: ['id', 'name', 'type'], raw: true });
  return books;
}

// 工具定义
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_transaction',
      description: '创建一笔记账交易记录。当用户提到消费、收入、花钱、进账等记账相关内容时使用此工具。',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['expense', 'income'],
            description: '交易类型：expense=支出，income=收入'
          },
          amount: {
            type: 'number',
            description: '交易金额（数字）'
          },
          categoryName: {
            type: 'string',
            description: '分类名称，如：餐饮、交通、工资等。从用户输入中推断最匹配的分类。'
          },
          note: {
            type: 'string',
            description: '交易备注/说明，简短描述这笔交易'
          },
          transactionDate: {
            type: 'string',
            description: '交易日期，格式 YYYY-MM-DD。如果用户没说具体日期，使用今天的日期。'
          }
        },
        required: ['type', 'amount', 'categoryName', 'note', 'transactionDate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_todo',
      description: '创建一条待办事项。当用户提到待办、提醒、任务、要做的事、记住、别忘了等内容时使用此工具。',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: '待办标题，简短描述要做的事'
          },
          description: {
            type: 'string',
            description: '详细描述（可选）'
          },
          dueDate: {
            type: 'string',
            description: '截止日期，格式 YYYY-MM-DD。如果用户没说具体日期，留空。'
          },
          dueTime: {
            type: 'string',
            description: '截止时间，格式 HH:mm。如果用户没说具体时间，留空。'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: '优先级：low=低, medium=中, high=高。根据紧急程度判断。'
          }
        },
        required: ['title', 'priority']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_inventory_item',
      description: '创建一条物品记录。当用户提到任何实物物品（如食物、日用品、电子产品等）或提到保质期、过期时间时使用此工具。注意：如果用户只是提到物品名称（如牛奶、面包、手机），就应该使用此工具创建物品记录，而不是创建待办事项。',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: '物品名称，简短描述物品'
          },
          expiryDate: {
            type: 'string',
            description: '过期日期，格式 YYYY-MM-DD。根据用户描述推算，如"保质期6个月"则从今天推算。如果用户没说，留空。'
          }
        },
        required: ['name']
      }
    }
  }
];

// 匹配分类
function matchCategory(categories, name, type) {
  // 精确匹配
  let cat = categories.find(c => c.name === name && c.type === type);
  if (cat) return cat;
  // 模糊匹配
  cat = categories.find(c => c.name.includes(name) && c.type === type);
  if (cat) return cat;
  cat = categories.find(c => name.includes(c.name) && c.type === type);
  if (cat) return cat;
  // 返回同类型的第一个分类
  return categories.find(c => c.type === type && !c.parentId) || categories.find(c => c.type === type);
}

// 执行工具调用
async function executeTool(toolName, args, userId, familyId) {
  if (toolName === 'create_transaction') {
    const categories = await getUserCategories(familyId);
    const books = await getUserBooks(userId, familyId);

    if (!books.length) {
      return { success: false, message: '没有可用的账本，请先创建账本' };
    }

    const bookId = books[0].id;
    const type = args.type || 'expense';
    const category = matchCategory(categories, args.categoryName || '', type);

    if (!category) {
      return { success: false, message: `找不到分类"${args.categoryName}"` };
    }

    const txn = await Transaction.create({
      bookId,
      type,
      amount: parseFloat(args.amount),
      categoryId: category.id,
      note: args.note || '',
      transactionDate: args.transactionDate || dayjs().format('YYYY-MM-DD'),
      createdBy: userId,
      source: 'manual'
    });

    return {
      success: true,
      message: '记账成功',
      transaction: {
        id: txn.id,
        type,
        amount: parseFloat(args.amount),
        categoryName: category.name,
        note: args.note || '',
        date: args.transactionDate || dayjs().format('YYYY-MM-DD')
      }
    };
  }

  if (toolName === 'create_todo') {
    const { Todo } = require('../models');
    const todo = await Todo.create({
      familyId,
      title: args.title,
      description: args.description || '',
      dueDate: args.dueDate || null,
      dueTime: args.dueTime || null,
      priority: args.priority || 'medium',
      createdBy: userId,
      status: 'active',
      completed: false,
      archived: false
    });

    return {
      success: true,
      message: '待办创建成功',
      todo: {
        id: todo.id,
        title: todo.title,
        dueDate: todo.dueDate,
        dueTime: todo.dueTime,
        priority: todo.priority
      }
    };
  }

  if (toolName === 'create_inventory_item') {
    const item = await Item.create({
      name: args.name,
      quantity: 1,
      category: '',
      spaceId: null,
      price: 9.9,
      purchaseDate: dayjs().format('YYYY-MM-DD'),
      expiryDate: args.expiryDate || null,
      description: '',
      tags: '',
      createdBy: userId,
      status: 'active'
    });

    return {
      success: true,
      message: '物品添加成功',
      item: {
        id: item.id,
        name: item.name,
        expiryDate: item.expiryDate
      }
    };
  }

  return { success: false, message: '未知工具' };
}

// 非流式聊天（支持工具调用）
exports.chat = async (req, res, next) => {
  try {
    const { messages } = req.body;
    if (!messages || !messages.length) {
      return res.status(400).json({ code: 400, message: '请输入消息' });
    }

    const config = await getAIConfig();
    if (!config.apiKey) {
      return res.status(400).json({ code: 400, message: 'AI 功能未配置，请联系管理员设置 API Key' });
    }

    // 获取用户的分类和账本信息，增强系统提示词
    const familyId = req.query.familyId || req.body.familyId;
    const categories = await getUserCategories(familyId);
    const books = await getUserBooks(req.userId, familyId);
    const catNames = categories.filter(c => !c.parentId).map(c => c.name).join('、');

    const enhancedSystemPrompt = `${config.systemPrompt}

你有以下工具可以使用：
- create_transaction: 当用户提到记账、消费、收入、花钱、进账等时，使用此工具创建交易记录。
- create_todo: 当用户提到待办、提醒、任务、要做的事、记住、别忘了等时，使用此工具创建待办事项。
- create_inventory_item: 当用户提到任何实物物品名称（如牛奶、面包、手机、充电宝、衣服等）或提到保质期、过期时间时，使用此工具创建物品记录。注意：物品名称+保质期/过期时间的组合（如"牛奶 保质期1个月"）是物品录入，不是待办事项。

重要区分规则：
- 如果用户提到的是具体物品名称（名词），应该使用 create_inventory_item
- 只有当用户明确表示要做某件事（动词+任务）时，才使用 create_todo
- "牛奶 保质期1个月" = 物品录入（create_inventory_item）
- "买牛奶" = 待办事项（create_todo）

当前用户的分类有：${catNames || '暂无分类'}
当前用户的账本有：${books.map(b => b.name).join('、') || '暂无账本'}
今天的日期是：${dayjs().format('YYYY-MM-DD')}

请根据用户的描述，智能匹配最合适的分类。如果用户没有指定日期，使用今天的日期。待办事项请根据紧急程度判断优先级。物品录入时只需要物品名称和过期时间，如果用户说了保质期，请根据今天日期推算过期时间。`;

    const allMessages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...messages
    ];

    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: allMessages,
        tools: TOOLS,
        tool_choice: 'auto',
        stream: false,
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[AI] DeepSeek API error:', response.status, err);
      return res.status(500).json({ code: 500, message: 'AI 服务请求失败，请检查配置' });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    // 检查是否有工具调用
    if (message?.tool_calls?.length) {
      const toolCall = message.tool_calls[0];
      const toolName = toolCall.function.name;
      let toolArgs;
      try {
        toolArgs = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        toolArgs = {};
      }

      // 执行工具调用
      const toolResult = await executeTool(toolName, toolArgs, req.userId, familyId);

      // 将工具调用结果发送给 AI 获取回复
      const followUpMessages = [
        ...allMessages,
        message,
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        }
      ];

      const followUpResponse = await fetch(`${config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: followUpMessages,
          stream: false,
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      let reply = '';
      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        reply = followUpData.choices?.[0]?.message?.content || '';
      }

      res.json({
        code: 0,
        data: {
          reply: reply || (toolResult.success ? '记账成功！' : toolResult.message),
          toolCall: {
            name: toolName,
            result: toolResult
          },
          usage: data.usage
        }
      });
    } else {
      // 普通文本回复
      const reply = message?.content || '抱歉，我没有理解您的问题。';
      res.json({ code: 0, data: { reply, usage: data.usage } });
    }
  } catch (err) {
    console.error('[AI] Error:', err.message);
    next(err);
  }
};

// 流式聊天（不支持工具调用，用于普通对话）
exports.chatStream = async (req, res, next) => {
  let abortController = null;
  let clientDisconnected = false;

  // 监听客户端断连
  req.on('close', () => {
    clientDisconnected = true;
    if (abortController) abortController.abort();
  });

  try {
    const { messages } = req.body;
    if (!messages || !messages.length) {
      return res.status(400).json({ code: 400, message: '请输入消息' });
    }

    const config = await getAIConfig();
    if (!config.apiKey) {
      return res.status(400).json({ code: 400, message: 'AI 功能未配置' });
    }

    const allMessages = [
      { role: 'system', content: config.systemPrompt },
      ...messages
    ];

    // 30 秒超时
    abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 30000);

    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: allMessages,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7
      }),
      signal: abortController.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      console.error('[AI] DeepSeek API error:', response.status, err);
      return res.status(500).json({ code: 500, message: 'AI 服务请求失败' });
    }

    if (clientDisconnected) return;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (!clientDisconnected) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } catch (streamErr) {
      if (streamErr.name !== 'AbortError') {
        console.error('[AI] Stream error:', streamErr.message);
      }
    } finally {
      reader.cancel().catch(() => {});
      res.end();
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      if (!res.headersSent) {
        res.status(504).json({ code: 504, message: 'AI 服务请求超时' });
      } else {
        res.end();
      }
    } else {
      console.error('[AI] Error:', err.message);
      next(err);
    }
  }
};
