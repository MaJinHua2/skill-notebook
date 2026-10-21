// Direct detail links are independent of the tag-based workflow filters.
export const EMBEDDED_GUIDE = [
 ['需求与验收','intent-driven-development','把模糊需求变成明确的触发条件、预期行为和验收方法'],
 ['变更分析','change-impact','改协议、参数、驱动或配置前，追踪固件、上位机和历史数据的影响'],
 ['项目上下文','context-and-decisions','统一术语、单位、配置含义和关键约束，关联板卡与协议资料'],
 ['架构决策','architecture-decision-records','记录轮询／中断／DMA、任务划分、内存和升级方案的选择依据'],
 ['C++ 实现与审查','cpp-coding-standards','检查类型、资源生命周期、接口和并发使用，尤其适合 Qt／嵌入式 Linux'],
 ['C++ 单元测试','cpp-testing','测试协议解析、状态机、计算和参数校验，用替身隔离硬件访问'],
 ['测试管理','test-collaboration','将需求、缺陷与测试证据对应起来，明确主机、仿真、真板和人工验收的边界'],
 ['模块回归','module-regression','修改公共模块后，确定哪些下游模块和验收命令需要重跑'],
 ['性能优化','benchmark-optimization-loop','先测基线，再验证单个优化假设，比较耗时、内存或吞吐变化'],
 ['提交说明','conventional-commit-review','根据真实差异写清原因、变化、兼容边界和验证情况']
].map(([label,slug,description])=>({label,slug,description,id:`ecc/native/${slug}`}));
