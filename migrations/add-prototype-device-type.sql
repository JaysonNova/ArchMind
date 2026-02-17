-- 添加 device_type 字段到 prototypes 表
-- 用于指定原型图的目标设备类型

-- 添加 device_type 列，默认值为 'responsive'
ALTER TABLE prototypes
ADD COLUMN IF NOT EXISTS device_type VARCHAR(20) DEFAULT 'responsive';

-- 添加检查约束，确保值在允许的范围内
ALTER TABLE prototypes
ADD CONSTRAINT chk_device_type
CHECK (device_type IN ('desktop', 'tablet', 'mobile', 'responsive'));

-- 为现有数据设置默认值
UPDATE prototypes
SET device_type = 'responsive'
WHERE device_type IS NULL;
