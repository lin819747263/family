/**
 * 数据库迁移工具 - 自动检测并添加缺失字段
 * 启动时自动执行，无需手动干预
 */

/**
 * 获取数据库中表的现有字段
 */
async function getExistingColumns(sequelize, tableName) {
  const [columns] = await sequelize.query(`DESCRIBE ${tableName}`);
  return columns.map(col => col.Field);
}

/**
 * 从 Sequelize 模型定义中提取字段信息
 */
function getModelColumns(model) {
  const attributes = model.rawAttributes;
  const columns = [];

  for (const [name, attr] of Object.entries(attributes)) {
    if (name === 'id' || name === 'createdAt' || name === 'updatedAt') continue;

    const field = attr.field || name;
    const type = attr.type;
    const allowNull = attr.allowNull !== false;
    const defaultValue = attr.defaultValue;
    const comment = attr.comment || '';

    // 构建 SQL 类型
    let sqlType = '';
    const typeName = type.constructor.name;

    if (typeName === 'INTEGER') {
      sqlType = 'INTEGER';
    } else if (typeName === 'STRING') {
      sqlType = `VARCHAR(${type._length || 255})`;
    } else if (typeName === 'TEXT') {
      sqlType = 'TEXT';
    } else if (typeName === 'BOOLEAN') {
      sqlType = 'TINYINT(1)';
    } else if (typeName === 'DATE') {
      sqlType = 'DATETIME';
    } else if (typeName === 'DATEONLY') {
      sqlType = 'DATE';
    } else if (typeName === 'DECIMAL') {
      sqlType = `DECIMAL(${type._precision || 10},${type._scale || 2})`;
    } else if (typeName === 'JSON' || typeName === 'JSONTYPE') {
      sqlType = 'JSON';
    } else if (typeName === 'ENUM') {
      const values = type.values.map(v => `'${v}'`).join(', ');
      sqlType = `ENUM(${values})`;
    } else if (typeName === 'FLOAT') {
      sqlType = 'FLOAT';
    } else if (typeName === 'BIGINT') {
      sqlType = 'BIGINT';
    } else {
      // 跳过不支持的类型
      continue;
    }

    // 构建默认值
    let defaultClause = '';
    if (defaultValue !== undefined && defaultValue !== null) {
      if (typeof defaultValue === 'string') {
        defaultClause = ` DEFAULT '${defaultValue}'`;
      } else if (typeof defaultValue === 'boolean') {
        defaultClause = ` DEFAULT ${defaultValue ? 1 : 0}`;
      } else if (typeof defaultValue === 'number') {
        defaultClause = ` DEFAULT ${defaultValue}`;
      }
    }

    // 构建注释
    const commentClause = comment ? ` COMMENT '${comment.replace(/'/g, "\\'")}'` : '';

    // 构建完整 SQL
    const nullableClause = allowNull ? '' : ' NOT NULL';
    const sql = `ALTER TABLE ${model.tableName} ADD COLUMN ${field} ${sqlType}${defaultClause}${nullableClause}${commentClause}`;

    columns.push({ field, sql });
  }

  return columns;
}

/**
 * 执行迁移：自动添加缺失字段
 */
async function autoMigrate(sequelize, models) {
  console.log('\n[迁移] 开始检查数据库字段...');

  const results = {
    added: [],
    skipped: [],
    errors: []
  };

  for (const [modelName, model] of Object.entries(models)) {
    if (!model.tableName || !model.rawAttributes) continue;

    try {
      // 检查表是否存在
      const [tables] = await sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = '${model.tableName}' AND TABLE_SCHEMA = DATABASE()`
      );

      if (tables.length === 0) {
        // 表不存在，跳过（由 sync 创建）
        continue;
      }

      const existingColumns = await getExistingColumns(sequelize, model.tableName);
      const modelColumns = getModelColumns(model);

      for (const { field, sql } of modelColumns) {
        if (!existingColumns.includes(field)) {
          try {
            await sequelize.query(sql);
            results.added.push(`${model.tableName}.${field}`);
            console.log(`[迁移] ✅ 添加 ${model.tableName}.${field}`);
          } catch (err) {
            if (err.message.includes('Duplicate column')) {
              results.skipped.push(`${model.tableName}.${field}`);
            } else {
              results.errors.push({ table: model.tableName, field, error: err.message });
              console.error(`[迁移] ❌ ${model.tableName}.${field}: ${err.message}`);
            }
          }
        }
      }
    } catch (err) {
      // 忽略查询错误，可能是表不存在
    }
  }

  // 输出摘要
  if (results.added.length > 0) {
    console.log(`[迁移] 完成，共添加 ${results.added.length} 个字段`);
  } else if (results.errors.length === 0) {
    console.log('[迁移] 数据库结构已是最新，无需迁移');
  }

  if (results.errors.length > 0) {
    console.error(`[迁移] 有 ${results.errors.length} 个字段添加失败`);
  }

  return results;
}

module.exports = { autoMigrate };
