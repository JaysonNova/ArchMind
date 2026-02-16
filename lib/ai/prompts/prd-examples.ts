/**
 * PRD Few-shot 示例库
 * 用于指导AI生成高质量的PRD文档
 */

import type { PRDExample } from './prd-system'

/**
 * 示例 1: 电商功能 - 积分抵现
 */
const pointsRedemptionExample: PRDExample = {
  userInput: '我想在电商App的结算页增加一个积分抵现功能',
  context: `[文档 1: 积分系统设计]
- 现有积分规则: 用户购物获得积分，1元=1积分
- 积分有效期: 获得12个月后过期
- 积分用途: 可兑换优惠券、参与抽奖

[文档 2: 结算页现有功能]
- 支持优惠券抵扣
- 支持余额支付
- 订单金额=商品金额-优惠券-余额+运费`,

  prdOutput: `## 1. 产品概述

**产品名称:** 积分抵现

**一句话定位:** 用户在结算时可使用积分直接抵扣订单金额

**价值主张:**
- **用户价值:** 提升积分实用性，让积分可直接当钱花
- **商业价值:** 提高用户活跃度和复购率，预计提升15%
- **技术价值:** 复用现有结算逻辑，开发成本低

---

## 4. 核心功能

### 4.1 积分抵现功能

**优先级:** Must-have

**功能描述:**
用户在结算页可选择使用积分抵扣部分订单金额。积分抵扣比例为 100积分=1元，单笔订单最多抵扣订单金额的 30%。抵扣逻辑在优惠券和余额之后执行。

积分抵现的计算公式：
- 可抵扣金额 = Math.min(用户积分/100, 订单剩余金额×0.3)
- 订单剩余金额 = 商品金额 - 优惠券抵扣 - 余额支付 + 运费

**用户流程:**
1. 用户进入结算页，系统展示可用积分数和可抵扣金额
2. 用户开启"积分抵现"开关
3. 系统自动计算抵扣金额（不超过订单金额30%）
4. 用户确认支付，系统扣减积分并更新订单实付金额
5. 支付成功后，积分抵扣记录写入point_redemption_log表

**边界条件:**
- **积分不足100时:** 灰色开关，提示"积分不足100，无法使用"
- **订单金额<10元:** 禁用抵扣，避免小额订单积分抵扣影响平台收益
- **积分过期:** 已过期积分不显示在可用额度中，仅展示有效积分
- **与其他优惠叠加:** 优先使用优惠券→积分抵现→余额支付
- **退款场景:** 订单退款时，优先退回积分（按原抵扣比例），其次退回现金

**数据要求:**
- 用户积分数: 来自 \`user_points\` 表的 \`total_points\` 字段
- 积分过期时间: \`points_expiry_date\` 字段
- 抵扣记录: 写入 \`point_redemption_log\` 表，包含订单ID、抵扣积分、抵扣金额、抵扣时间

---

## 6. 成功指标

### 6.1 用户采用率
- **定义:** 启用积分抵现的用户占总用户比例
- **目标:** 上线 30 天内达到 40%
- **度量方式:** (使用过积分抵现的用户数 / 活跃用户数) × 100%
- **数据来源:** 埋点事件 \`point_redemption_enabled\`
- **追踪频率:** 每周

### 6.2 抵扣金额占比
- **定义:** 积分抵扣金额占总订单金额的平均比例
- **目标:** 15-25%（控制在30%上限内）
- **度量方式:** Σ(积分抵扣金额) / Σ(订单金额) × 100%
- **数据来源:** \`point_redemption_log\` 表
- **追踪频率:** 每天

### 6.3 功能转化率
- **定义:** 开启积分抵现开关后实际完成支付的比例
- **目标:** > 85%
- **度量方式:** (完成支付订单数 / 开启抵现的订单数) × 100%
- **追踪频率:** 实时监控

### 6.4 用户复购率提升
- **定义:** 使用积分抵现用户的30天复购率 vs 普通用户
- **目标:** 提升 20%
- **度量方式:** (使用积分用户复购率 - 普通用户复购率) / 普通用户复购率 × 100%
- **数据来源:** 用户行为分析系统
- **追踪频率:** 每月

### 6.5 积分活跃度
- **定义:** 使用积分抵现功能的用户积分消耗速度
- **目标:** 积分周转率提升 30%
- **度量方式:** (本期消耗积分数 / 期初可用积分数) × 100%
- **追踪频率:** 每月`,

  category: 'feature'
}

/**
 * 示例 2: 智能推荐
 */
const smartRecommendationExample: PRDExample = {
  userInput: '在首页增加一个"为你推荐"模块，根据用户的浏览历史和购买记录推荐商品',
  context: `[文档 1: 商品搜索功能 PRD]
- 现有搜索算法: Elasticsearch + TF-IDF
- 商品标签体系: 3级类目 + 人工标签（品牌、风格、场景）
- 用户行为埋点: view, click, add_to_cart, purchase

[文档 2: 个性化营销方案]
- 用户分群: 高价值用户、活跃用户、流失预警用户
- 推荐位运营: 首页Banner、搜索结果置顶
- A/B测试平台: 支持灰度发布和效果对比`,

  prdOutput: `## 1. 产品概述

**产品名称:** 智能推荐引擎

**一句话定位:** 基于用户行为数据的个性化商品推荐系统

**价值主张:**
- **用户价值:** 减少搜索时间，快速发现感兴趣的商品
- **商业价值:** 提升点击率20%，转化率15%
- **技术价值:** 构建用户画像体系，赋能精准营销

---

## 4. 核心功能

### 4.1 协同过滤推荐

**优先级:** Must-have

**功能描述:**
基于用户的协同过滤算法（User-based Collaborative Filtering），识别相似用户群体的购买行为，推荐"购买了此商品的用户还购买了"类型的商品。

算法每4小时更新一次推荐结果，离线计算后存入Redis，支持实时查询（响应时间<50ms）。

**用户流程:**
1. 用户进入首页，系统识别用户ID
2. 调用推荐服务，传入user_id和context（首页/商品详情页）
3. 返回Top-20推荐商品，按相关性得分排序
4. 渲染推荐商品卡片，展示商品图、标题、价格、"猜你喜欢"标签
5. 用户点击商品，触发埋点事件recommendation_click

**边界条件:**
- **新用户无历史数据:** 降级为热门商品推荐（按销量排序）
- **推荐结果不足20个:** 用同类目热销商品补齐
- **商品已下架:** 过滤已下架商品，不展示
- **推荐重复:** 与浏览历史去重，避免推荐用户已看过的商品

**数据要求:**
- 用户行为数据: \`user_behavior_log\`表（user_id, item_id, action, timestamp）
- 商品向量: \`item_embeddings\`表（item_id, embedding_vector）
- 推荐结果缓存: Redis key \`recommendations:{user_id}\` → [item_ids]

### 4.2 实时行为追踪

**优先级:** Should-have

**功能描述:**
实时采集用户的浏览、点击、加购、购买行为，更新用户画像。使用Kafka消息队列异步处理，避免影响主流程性能。

**用户流程:**
1. 用户浏览商品详情页
2. 前端触发埋点事件 \`view_item\`
3. 事件发送至Kafka \`user-behavior\` topic
4. 后端消费者处理事件，更新用户画像
5. 标记用户画像为"需更新"状态，下次推荐时重新计算

**边界条件:**
- **埋点丢失:** 允许5%的埋点丢失率，不影响整体效果
- **异常行为:** 识别爬虫行为（1分钟浏览>50个商品），过滤异常数据

**数据要求:**
- 埋点事件: 包含user_id, item_id, action, timestamp, device_id
- Kafka topic: \`user-behavior\`，分区数=6
- 用户画像: \`user_profiles\`表（user_id, preferences, last_updated）

---

## 6. 成功指标

### 6.1 推荐点击率（CTR）
- **定义:** 推荐商品的点击次数 / 展示次数
- **目标:** 上线14天达到8%（高于首页平均CTR 5%）
- **度量方式:** (click_events / impression_events) × 100%
- **数据来源:** 埋点 \`recommendation_click\`, \`recommendation_impression\`
- **追踪频率:** 每天

### 6.2 推荐转化率
- **定义:** 通过推荐进入详情页后完成购买的比例
- **目标:** 3%（高于自然流量转化率2%）
- **度量方式:** (推荐商品购买订单数 / 推荐商品点击数) × 100%
- **追踪频率:** 每周`,

  category: 'feature'
}

/**
 * 示例 3: 搜索性能优化
 */
const searchOptimizationExample: PRDExample = {
  userInput: '优化商品搜索性能，当前搜索响应时间平均800ms，目标降到200ms以内',
  context: `[文档 1: 搜索系统现状]
- 搜索引擎: Elasticsearch 7.10
- 索引大小: 商品索引500万条，品牌索引10万条
- 当前性能: P50=600ms, P95=1200ms, P99=2000ms
- 瓶颈: 数据库联表查询慢，索引设计不合理

[文档 2: 监控数据]
- 搜索QPS: 峰值2000，平均800
- 错误率: 0.5%（超时导致）
- 用户反馈: 搜索结果加载慢，影响购物体验`,

  prdOutput: `## 1. 产品概述

**产品名称:** 搜索性能优化

**一句话定位:** 通过架构优化和缓存策略，将搜索响应时间降至200ms以内

**价值主张:**
- **用户价值:** 提升搜索体验，快速找到心仪商品
- **商业价值:** 降低搜索超时导致的用户流失，预计提升转化率5%
- **技术价值:** 优化系统架构，提升搜索服务稳定性

---

## 4. 核心功能

### 4.1 搜索结果缓存

**优先级:** Must-have

**功能描述:**
引入Redis缓存层，缓存热门搜索词的搜索结果。缓存策略采用LRU（Least Recently Used）算法，TTL设置为5分钟。缓存命中率目标>60%。

**用户流程:**
1. 用户输入搜索词，点击搜索按钮
2. 系统对搜索词进行标准化处理（去空格、转小写、同义词替换）
3. 查询Redis缓存，检查是否存在缓存结果
4. 如命中缓存，直接返回结果（响应时间<50ms）
5. 如未命中，调用Elasticsearch查询，结果写入缓存后返回

**边界条件:**
- **缓存穿透:** 对不存在的搜索词也缓存空结果，TTL=1分钟
- **缓存雪崩:** 缓存过期时间加随机值（5分钟±30秒），避免同时失效
- **库存变更:** 商品下架时，主动清除相关搜索词缓存

**数据要求:**
- 缓存key格式: \`search:{normalized_query}\`
- 缓存value: JSON序列化的商品ID列表
- Redis内存限制: 2GB，监控内存使用率<70%

### 4.2 索引优化

**优先级:** Must-have

**功能描述:**
重新设计Elasticsearch索引结构，优化字段映射和分片策略。主要优化点：
1. 删除不必要的字段，减少索引体积
2. 对搜索字段设置合适的analyzer（中文使用ik_max_word）
3. 调整分片数，从5个主分片调整为10个

**用户流程:**
1. 运维团队创建新索引 \`products_v2\`
2. 后台任务将数据从旧索引迁移到新索引
3. 验证新索引数据完整性
4. 切换别名 \`products\` 指向新索引
5. 监控搜索性能，确认优化效果

**边界条件:**
- **迁移失败:** 保留旧索引7天，支持快速回滚
- **数据不一致:** 使用版本号机制，确保迁移过程中数据一致性

**数据要求:**
- 索引字段: 仅保留搜索必需字段（商品ID、标题、类目、价格、库存状态）
- 分片策略: 10个主分片，每个主分片1个副本
- 索引刷新间隔: 从1秒调整为5秒（牺牲实时性换取性能）

---

## 6. 成功指标

### 6.1 平均响应时间
- **定义:** 搜索请求从发起到返回结果的平均耗时
- **目标:** P50<100ms, P95<200ms, P99<500ms
- **度量方式:** 从监控系统提取P50/P95/P99指标
- **数据来源:** Prometheus监控指标 \`search_response_time\`
- **追踪频率:** 实时监控

### 6.2 缓存命中率
- **定义:** 搜索请求命中Redis缓存的比例
- **目标:** > 60%
- **度量方式:** (缓存命中次数 / 总搜索次数) × 100%
- **数据来源:** Redis监控指标 \`cache_hit_rate\`
- **追踪频率:** 每天`,

  category: 'optimization'
}

/**
 * 导出所有示例
 */
export const PRD_EXAMPLES: PRDExample[] = [
  pointsRedemptionExample,
  smartRecommendationExample,
  searchOptimizationExample
]

/**
 * 根据用户输入选择最相关的示例
 * @param userInput 用户输入
 * @param count 返回示例数量（默认2个）
 * @returns 最相关的PRD示例
 */
export function selectRelevantExamples (
  userInput: string,
  count: number = 2
): PRDExample[] {
  const input = userInput.toLowerCase()

  // 简单的关键词匹配策略
  const scores: Array<{ example: PRDExample; score: number }> = []

  for (const example of PRD_EXAMPLES) {
    let score = 0

    // 类别匹配
    if (example.category === 'feature' && (
      input.includes('增加') ||
      input.includes('新增') ||
      input.includes('开发')
    )) {
      score += 2
    }

    if (example.category === 'optimization' && (
      input.includes('优化') ||
      input.includes('性能') ||
      input.includes('提升')
    )) {
      score += 2
    }

    // 关键词匹配
    const keywords = extractKeywords(input)
    const exampleKeywords = extractKeywords(example.userInput.toLowerCase())

    for (const keyword of keywords) {
      if (exampleKeywords.includes(keyword)) {
        score += 1
      }
    }

    scores.push({ example, score })
  }

  // 按分数降序排序，返回前N个
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(item => item.example)
}

/**
 * 提取关键词（简单实现）
 */
function extractKeywords (text: string): string[] {
  // 移除停用词
  const stopWords = ['的', '我', '想', '在', '一个', '根据', '和', '等']

  // 分词（简单按空格和标点分割）
  const words = text
    .replace(/[，。！？、；：""''（）【】]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0 && !stopWords.includes(word))

  return words
}
