# Java 写出死锁的情况

## 题目
手写一段 Java 代码，演示多线程死锁（deadlock）是如何产生的，并说明原因与避免方法。

## 配图
![死锁循环等待示意](assets/deadlock.svg)

## 示例代码
```java
public class DeadLockDemo {
    // 两把锁
    private static final Object lockA = new Object();
    private static final Object lockB = new Object();

    public static void main(String[] args) {
        // 线程 A：先锁 A，再锁 B
        Thread threadA = new Thread(() -> {
            synchronized (lockA) {
                System.out.println("线程 A：获取到 lockA，准备获取 lockB...");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                synchronized (lockB) {
                    System.out.println("线程 A：获取到 lockB，执行业务逻辑。");
                }
            }
        }, "Thread-A");

        // 线程 B：先锁 B，再锁 A（获取顺序与 A 相反）
        Thread threadB = new Thread(() -> {
            synchronized (lockB) {
                System.out.println("线程 B：获取到 lockB，准备获取 lockA...");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                synchronized (lockA) {
                    System.out.println("线程 B：获取到 lockA，执行业务逻辑。");
                }
            }
        }, "Thread-B");

        threadA.start();
        threadB.start();
    }
}
```

## 死锁产生的四个必要条件
1. **互斥**：一个资源每次只能被一个线程使用
2. **持有并等待**：线程持有已获取的资源，同时等待其他资源
3. **不可剥夺**：已获取的资源不能被强制剥夺，只能自己释放
4. **循环等待**：多个线程形成头尾相接的循环等待关系

本例中：线程 A 持有 lockA 等待 lockB，线程 B 持有 lockB 等待 lockA → 四条全部满足 → 死锁。

## 关键点（面试追问）
- **为什么加 `Thread.sleep(100)`？** 让两个线程先各自拿到第一把锁，确保循环等待条件成立，稳定复现死锁。不加也有概率死锁，但加上更可控。
- **`synchronized` 是可重入锁**：同一线程可多次获取同一把锁不会自锁；不同线程之间互斥。
- **如何排查？** `jps` 找进程号 → `jstack <pid>` 查看线程 dump，会直接标注 `Found one Java-level deadlock`。

## 如何避免死锁
破坏四条件之一即可。最实用的是**破坏循环等待——固定加锁顺序**：让所有线程都按 lockA → lockB 的顺序获取。

```java
// 修复版：Thread-B 也改为先锁 A 再锁 B
Thread threadB = new Thread(() -> {
    synchronized (lockA) {        // 顺序统一为 A -> B
        synchronized (lockB) { /* 业务逻辑 */ }
    }
});
```

## 一句话总结
死锁 = 多线程以相反/交错顺序持有并等待锁；固定加锁顺序、使用带超时的 `tryLock`、减少锁粒度都能避免。
