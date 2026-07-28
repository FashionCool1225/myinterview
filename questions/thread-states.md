# Java 线程的 6 种状态与生命周期

## 题目
说说 Java 中线程有哪些状态？它们之间如何转换？`sleep` 和 `wait` 的区别是什么？

## 配图
![线程状态生命周期](assets/thread-lifecycle.svg)

## 六种状态
| 状态 | 含义 | 进入方式 |
|------|------|----------|
| **NEW** | 新建，未启动 | `new Thread()` |
| **RUNNABLE** | 可运行（含就绪 + 运行，Java 不区分） | `start()` |
| **BLOCKED** | 阻塞，等 `synchronized` 锁 | 抢锁失败 |
| **WAITING** | 无限等待 | `wait()` / `join()` / `LockSupport.park()` |
| **TIMED_WAITING** | 超时等待 | `sleep(ms)` / `wait(ms)` / `join(ms)` |
| **TERMINATED** | 终止，`run()` 结束 | 执行完 / 异常 |

## 关键区别（高频追问）
- `sleep()` **不释放锁**；`wait()` **释放锁**，且必须在 `synchronized` 块内调用，靠 `notify()/notifyAll()` 唤醒。
- `BLOCKED` 是抢 `synchronized` 监视器锁失败才进入；`WAITING` 是主动等待别人唤醒，机制不同。
- `RUNNABLE` 包含操作系统层面的「就绪」和「运行」——即使 `run()` 正在跑，Java 层面也只显示 RUNNABLE。
- 线程一旦进入 `TERMINATED` 就**不能重启**（再调用 `start()` 抛 `IllegalThreadStateException`）。

## 线程的分类
- **用户线程 vs 守护线程（Daemon）**：`setDaemon(true)` 设为守护线程。JVM 只等所有**用户线程**结束后才退出，守护线程随 JVM 一起结束（如 GC 线程、日志线程）。
- **JVM 自带的后台线程**：最简单的 Java 程序启动时，除 `main` 线程外，JVM 还会起 `Reference Handler`、`Finalizer`、`GC`、信号分发等线程，可用 `jstack` 查看。

## 一句话总结
Java 线程 = 一个执行流 + 6 状态生命周期；区分用户/守护线程，理解 `sleep`/`wait` 对锁的不同影响，是并发面试的基础。
