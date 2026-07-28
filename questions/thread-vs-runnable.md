# Thread 和 Runnable 的区别与联系

## 题目
Java 里 Thread 和 Runnable 分别是什么？它们之间有什么区别和联系？为什么要用 `start()` 而不是直接调 `run()`？

## 配图
![Thread 与 Runnable 关系](assets/thread-runnable.svg)

## 一、是什么
- **Thread**：Java 中表示“线程”的类，既是线程对象（执行单元），又承载了执行逻辑。它**既能描述任务（重写 `run()`），又能真正启动并管理一个线程**。
- **Runnable**：只有一个 `run()` 方法的接口（Java 8 起标注为 `@FunctionalInterface`，可用 Lambda）。它**只描述“要执行的任务”，本身不创建、也不管理线程**。

## 二、联系（它们是怎么连起来的）
1. **Thread 本身实现了 Runnable**：`public class Thread implements Runnable`，所以 Thread 本质上也是一个 Runnable。
2. **真正被执行的都是 `run()`**：`new Thread(task).start()` 时，Thread 的 `run()` 内部会判断 `target != null` 则调用 `target.run()`；这个 target 就是传进来的那个 Runnable。
3. **唯一的线程入口是 `Thread.start()`**：Runnable 自己没有启动能力，必须交给 Thread（或线程池）去跑。Runnable 只是把“任务”从“线程”里解耦出来。

## 三、区别（面试重点）
| 维度 | Thread | Runnable |
|------|--------|----------|
| 角色 | 线程类（执行单元 + 线程管理） | 任务接口（只描述任务） |
| 继承限制 | 继承 Thread 后**不能再继承其他类**（Java 单继承） | 实现 Runnable 仍可继承其他类、实现别的接口 |
| 耦合度 | 任务与线程**强耦合** | 任务与线程**解耦**，可交给任意线程 / 线程池 |
| 资源共享 | 多个线程共享同一 Thread 子类实例较别扭（常需 `static`） | 多个 Thread 可传入**同一个 Runnable 实例**，天然适合共享资源 |
| 使用频率 | 极少直接继承 | 最常用，配合 Thread 或线程池 |

## 四、关键机制：为什么用 start() 而不是 run()
- **`start()`** 才向 JVM 申请新线程，由新线程去调用 `run()`；一个 Thread 的 `start()` 只能调一次。
- **直接调 `run()`** 只是普通方法调用，在**当前线程**里同步执行，**并没有创建新线程**——这是新手最常见的坑。

## 源码级解析（JDK 8/11 一致）
下面结合 `Runnable` 与 `Thread` 的核心源码，看清二者如何衔接、`start()` 为何能开新线程。

**1) Runnable 接口——任务的本质就是一个方法**
```java
@FunctionalInterface
public interface Runnable {
    public abstract void run();   // Java 8 起标注 @FunctionalInterface，故可用 Lambda
}
```

**2) Thread 类声明——它本身就是 Runnable**
```java
public class Thread implements Runnable {
    private Runnable target;      // 持有“任务”的引用，解耦的关键
}
```
正因为 `implements Runnable`，Thread 既能执行，也能被当作 Runnable 传递。

**3) 构造器——把任务存进 target**
```java
public Thread(Runnable target) {
    init(null, target, "Thread-" + nextThreadNum(), 0);
}
// init 内部（节选）
this.target = target;   // 任务与线程彻底解耦成两个独立对象
```

**4) run()——默认只是转发给 target**
```java
@Override
public void run() {
    if (target != null) {
        target.run();   // 真正执行的是你传进来的 Runnable 的 run()
    }
}
```
这也解释了“继承 Thread 重写 run()”和“传 Runnable”二选一即可：子类重写 `run()` 就替换了这段逻辑；不重写则委托给 `target.run()`。

**5) start()——真正开线程的入口（native）**
```java
public synchronized void start() {
    if (threadStatus != 0)            // 重复调用直接抛 IllegalThreadStateException
        throw new IllegalThreadStateException();
    group.add(this);                  // 加入线程组
    boolean started = false;
    try {
        start0();                     // ← native 方法，交给 JVM
        started = true;
    } finally { ... }
}

private native void start0();         // JVM 在此创建操作系统线程，
                                       // 新线程启动后回调 Thread.run()，
                                       // 进而执行 target.run()
```

> 调用链：`start()` → `start0()`(native) → **JVM 创建新线程** → `Thread.run()` → `target.run()`（你的业务）。直接调 `run()` 会跳过 `start0()`，于是在当前线程同步执行，并不新建线程。

![start 到 target.run 源码调用链](assets/thread-runnable-flow.svg)

## 示例代码
```java
// 方式1：继承 Thread（耦合高，不推荐）
class MyThread extends Thread {
    @Override public void run() { System.out.println("线程: " + Thread.currentThread().getName()); }
}
new MyThread().start();

// 方式2：实现 Runnable（推荐，解耦、可共享）
class MyTask implements Runnable {
    @Override public void run() { System.out.println("任务: " + Thread.currentThread().getName()); }
}
new Thread(new MyTask()).start();

// 方式3：Lambda（Java 8+，最简洁，本质还是 Runnable）
new Thread(() -> System.out.println("lambda 任务")).start();

// 共享资源示例：两个线程共用同一个 Runnable 实例
class Counter implements Runnable {
    private int count = 0;
    public void run() { for (int i = 0; i < 1000; i++) count++; }
}
Counter c = new Counter();
new Thread(c).start();
new Thread(c).start();   // 两个线程共享同一个 count
```

## 易错点 / 面试追问
- **Runnable 不是线程**：它只是任务，`new Runnable(){...}` 不会起任何线程。
- **共享 ≠ 线程安全**：多个线程共享同一个 Runnable 实例的成员变量时，仍需 `synchronized` / `volatile` / 原子类保证可见性与原子性，否则有竞态。
- **`start()` 只能调一次**：重复调用抛 `IllegalThreadStateException`。
- **为什么还要有 Thread 类**：历史包袱 + 个别场景（自定义线程工厂、守护线程、线程分组）仍需直接用 Thread；但描述任务一律优先 Runnable / Callable。
- **进阶**：实际开发用 `ExecutorService` 线程池，提交的也是 `Runnable` / `Callable`，根本不直接 `new Thread`。

## 一句话总结
Thread 是“线程”本身（能跑、能管），Runnable 是“任务”（只说要干啥）；Thread 实现了 Runnable，二者通过 `run()` 衔接；开发中**优先用 Runnable 描述任务**，把线程交给 Thread 或线程池，避开单继承、降低耦合、便于共享。
