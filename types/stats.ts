/**
 * 统计数据类型定义
 */

export interface Stats {
  documentCount: number;
  prdCount: number;
  vectorCount: number;
}

export interface StatsResponse {
  success: boolean;
  data: Stats;
}
