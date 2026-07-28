/**
 * Java 死锁示例 —— 经典面试手写题
 *
 * 死锁产生的四个必要条件：
 *   1. 互斥：一个资源每次只能被一个线程使用
 *   2. 持有并等待：线程持有已获取的资源，同时等待其他资源
 *   3. 不可剥夺：已获取的资源不能被强制剥夺，只能自己释放
 *   4. 循环等待：多个线程形成头尾相接的循环等待关系
 *
 * 本例中：线程 A 持有 lockA 等待 lockB，线程 B 持有 lockB 等待 lockA
 * → 满足以上四条 → 死锁
 */
public class DeadLockDemo {

    // 两把锁
    private static final Object lockA = new Object();
    private static final Object lockB = new Object();

    public static void main(String[] args) {
        // 线程 A：先锁 A，再锁 B
        Thread threadA = new Thread(() -> {
            synchronized (lockA) {
                System.out.println("线程 A：获取到 lockA，准备获取 lockB...");

                // sleep 一会儿，让线程 B 有机会拿到 lockB，制造死锁
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                synchronized (lockB) {
                    System.out.println("线程 A：获取到 lockB，执行业务逻辑。");
                }
            }
        }, "Thread-A");

        // 线程 B：先锁 B，再锁 A  —— 锁的获取顺序与线程 A 相反
        Thread threadB = new Thread(() -> {
            synchronized (lockB) {
                System.out.println("线程 B：获取到 lockB，准备获取 lockA...");

                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                synchronized (lockA) {
                    System.out.println("线程 B：获取到 lockA，执行业务逻辑。");
                }
            }
        }, "Thread-B");

        threadA.start();
        threadB.start();
    }
}
