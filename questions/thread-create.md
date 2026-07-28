# Java 创建线程的 4 种方式

## 题目
Java 中创建/启动一个线程有哪几种方式？实际开发用哪种？

## 示例代码
```java
import java.util.concurrent.*;

public class ThreadCreateDemo {
    public static void main(String[] args) throws Exception {
        // 方式一：继承 Thread 类，重写 run()
        Thread t1 = new Thread() {
            public void run() {
                System.out.println("方式一：继承 Thread -> " + Thread.currentThread().getName());
            }
        };
        t1.start();

        // 方式二：实现 Runnable 接口（任务与线程解耦，推荐）
        Runnable task = () -> System.out.println("方式二：Runnable -> " + Thread.currentThread().getName());
        new Thread(task).start();

        // 方式三：实现 Callable + Future，可返回结果、可抛异常
        Callable<String> callable = () -> "方式三：Callable 的返回值";
        ExecutorService pool = Executors.newSingleThreadExecutor();
        Future<String> future = pool.submit(callable);
        System.out.println(future.get());
        pool.shutdown();

        // 方式四：线程池（实际开发最常用，控制并发、复用线程）
        ExecutorService threadPool = Executors.newFixedThreadPool(2);
        threadPool.execute(() -> System.out.println("方式四：线程池 -> " + Thread.currentThread().getName()));
        threadPool.shutdown();
    }
}
```

## 四种方式对比
| 方式 | 返回结果 | 抛异常 | 解耦程度 | 适用场景 |
|------|----------|--------|----------|----------|
| 继承 Thread | 否 | 否 | 低（类单继承受限） | 教学/简单演示 |
| 实现 Runnable | 否 | 否 | 高 | 通用任务 |
| 实现 Callable | **是** | **是** | 高 | 需要结果/异常 |
| 线程池 | 可选 | 可选 | 高 | **生产首选** |

## 关键点（面试追问）
- **本质只有一种线程**：`new Thread().start()`。Runnable / Callable 只是把「任务」传进去，最终都由 Thread 执行。
- **`run()` vs `start()`**：调 `run()` 只是普通方法调用，仍在当前线程执行；调 `start()` 才真正创建新线程并异步执行 `run()`。
- **为什么推荐线程池？** 避免频繁创建/销毁线程的开销，可限制并发数、提供拒绝策略与监控。
- **`Runnable` vs `Callable`**：后者可通过 `Future` 拿返回值和捕获异常。

## 一句话总结
开发用线程池；区分「任务（Runnable/Callable）」与「执行器（Thread/线程池）」是理解并发的关键。
