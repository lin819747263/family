// 名人名言集
const quotes = [
  { text: '生活不止眼前的苟且，还有诗和远方的田野。', author: '高晓松' },
  { text: '世上只有一种英雄主义，就是在认清生活的真相之后，依然热爱生活。', author: '罗曼·罗兰' },
  { text: '人生没有白走的路，每一步都算数。', author: '李宗盛' },
  { text: '愿你出走半生，归来仍是少年。', author: '苏轼' },
  { text: '不乱于心，不困于情，不畏将来，不念过往。', author: '丰子恺' },
  { text: '你若盛开，清风自来。', author: '三毛' },
  { text: '人生如逆旅，我亦是行人。', author: '苏轼' },
  { text: '山有木兮木有枝，心悦君兮君不知。', author: '佚名《越人歌》' },
  { text: '且将新火试新茶，诗酒趁年华。', author: '苏轼' },
  { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白' },
  { text: '天生我材必有用，千金散尽还复来。', author: '李白' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '人生自古谁无死，留取丹心照汗青。', author: '文天祥' },
  { text: '海内存知己，天涯若比邻。', author: '王勃' },
  { text: '落红不是无情物，化作春泥更护花。', author: '龚自珍' },
  { text: '千磨万击还坚劲，任尔东西南北风。', author: '郑燮' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '佚名' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
  { text: '问渠那得清如许？为有源头活水来。', author: '朱熹' },
  { text: '沉舟侧畔千帆过，病树前头万木春。', author: '刘禹锡' },
  { text: '会当凌绝顶，一览众山小。', author: '杜甫' },
  { text: '春风得意马蹄疾，一日看尽长安花。', author: '孟郊' },
  { text: '人生得意须尽欢，莫使金樽空对月。', author: '李白' },
  { text: '但愿人长久，千里共婵娟。', author: '苏轼' },
  { text: '两情若是久长时，又岂在朝朝暮暮。', author: '秦观' },
  { text: '众里寻他千百度，蓦然回首，那人却在灯火阑珊处。', author: '辛弃疾' },
  { text: '一寸光阴一寸金，寸金难买寸光阴。', author: '王贞白' },
  { text: '少壮不努力，老大徒伤悲。', author: '佚名《长歌行》' },
  { text: '天行健，君子以自强不息。', author: '《周易》' },
  { text: '知者不惑，仁者不忧，勇者不惧。', author: '孔子' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '己所不欲，勿施于人。', author: '孔子' },
  { text: '温故而知新，可以为师矣。', author: '孔子' },
  { text: '三人行，必有我师焉。', author: '孔子' },
  { text: '生于忧患，死于安乐。', author: '孟子' },
  { text: '穷则独善其身，达则兼济天下。', author: '孟子' },
  { text: '天将降大任于是人也，必先苦其心志，劳其筋骨。', author: '孟子' },
  { text: '静以修身，俭以养德。', author: '诸葛亮' },
  { text: '非淡泊无以明志，非宁静无以致远。', author: '诸葛亮' },
  { text: '家是最小国，国是千万家。', author: '《国家》' },
  { text: '陪伴是最长情的告白。', author: '佚名' },
  { text: '幸福不是房子有多大，而是房里的笑声有多甜。', author: '佚名' },
  { text: '家人闲坐，灯火可亲。', author: '汪曾祺' },
  { text: '世间万物皆有情，难得最是心从容。', author: '汪曾祺' },
  { text: '人生忽如寄，莫辜负茶、汤和好天气。', author: '汪曾祺' },
  { text: '四方食事，不过一碗人间烟火。', author: '汪曾祺' },
  { text: '家人平安，岁月静好，便是最大的幸福。', author: '佚名' },
  { text: '把平凡的日子过成诗，就是最好的生活。', author: '佚名' },
  { text: '用心生活的人，生活也会用心回馈你。', author: '佚名' }
]

/**
 * 根据日期获取当天的名言（每天固定一条）
 */
export function getDailyQuote() {
  const today = new Date()
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000)
  const index = dayOfYear % quotes.length
  return quotes[index]
}

/**
 * 随机获取一条名言
 */
export function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)]
}
