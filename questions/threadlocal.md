# ThreadLocal：线程局部变量（是什么 + 与线程的关系 + 用法）

## 题目
说说 ThreadLocal 是什么？它和 Thread 到底什么关系？怎么用？为什么线程池里必须 `remove()`？

## 配图
![ThreadLocal 与 Thread 的关系](assets/threadlocal-relation.svg)

## 小白前置：先搞懂两个基础概念

读不懂正文里的「弱引用」「ThreadLocalMap」？先补这两点，后面就通了。

### 概念一：强引用 vs 弱引用（Java 的四种引用里最常用的两种）

Java 里 `new Object()` 是在内存里造对象，变量只是拽着一根「绳子」指向它，这根绳子叫**引用**。垃圾回收器（GC）的规则很简单：**一个对象只要还有「强引用」拽着就不会被回收；谁都拽不着了，下次 GC 就清掉它。**

- **强引用（Strong）**：你平时写的 `Object o = new Object();` 就是强引用，像手紧攥的粗绳，GC 永远抢不走；`o = null` 松手后对象才可能回收。
- **弱引用（Weak）**：用 `WeakReference` 包的引用，像一根快断的细线。规则是**一个对象如果只剩下弱引用拽着它（没有任何强引用），那么不管内存够不够，GC 一扫就立刻回收**，之后 `weakRef.get()` 返回 `null`。

一句话：强引用 = 死拽不放；弱引用 = 没人强拽就随 GC 收走。

### 概念二：ThreadLocalMap 是什么

先说 **Map（映射表）**：就是「键值对」仓库，像字典——`put(key, value)` 存、`get(key)` 按 key 取、`remove(key)` 删。你熟悉的 `HashMap` 就是 Map 的一种。

**ThreadLocalMap 也是个 Map，但三个地方不普通：**

1. **它不属于 `ThreadLocal` 类，而是属于 `Thread` 对象**。每个线程体内都有一个字段 `threadLocals`（类型正是 ThreadLocalMap）。所以**数据挂在「线程」身上，线程活着它就在，线程销毁它才没**——这正是「线程局部变量」的由来。
2. **它的 key 是 `ThreadLocal` 实例本身，value 是你 `set` 进去的数据**。`tl.set("A")` 等价于「往当前线程的那个 map 里，以 `tl` 为 key 存一份 `"A"`」。
3. **它不是 `HashMap`，是 JDK 专为 ThreadLocal 定制的哈希表**：key 被包成**弱引用**（`WeakReference`），value 仍是**强引用**；冲突时不用链表，而是「往后找空位」（开放寻址）。

把这两点记住，正文里「为什么 key 用弱引用却还会内存泄漏」就迎刃而解：key 是弱引用（无强引用时会被 GC 回收成 `null`），但 value 是强引用，所以 key 没了 value 还挂着 → 泄漏。解决办法永远是你自己 `remove()`。

## 核心答案

### 1. 是什么
`ThreadLocal` 俗称「线程局部变量」：同一个 `ThreadLocal` 对象，在**不同线程**里 `get()` 出来的值互不相干。它给每个线程都准备了一份**独立的变量副本**，线程之间互不干扰，因此天然线程安全——**不用加锁**。

### 2. 与线程的关系（重点）
一句话：**`ThreadLocal` 自己不存数据，它只是把「钥匙」；真正的数据存在 `Thread` 对象自己的字段 `threadLocals`（类型是 `ThreadLocalMap`）里。**

- 一个 `ThreadLocal` 实例可以被多个线程共用（当作同一个 key）；
- 但每个线程在自己的 `ThreadLocalMap` 里存的是**各自独立的 value**；
- 整体是一个「N 个线程 × M 个 ThreadLocal」的矩阵，**每个 (线程, key) 格子互不影响**；
- 因为 `threadLocals` 是 `Thread` 的成员，所以数据**跟着线程走，线程销毁它才销毁**。

### 3. 底层结构（源码级）
- `ThreadLocalMap` 是定制哈希表，**不是 HashMap**：用**开放寻址 + 线性探测**解决冲突（不拉链表）。
- 节点 `Entry extends WeakReference<ThreadLocal<?>>`：key 是**弱引用**，value 是**强引用**。
- 理想下标 = `threadLocalHashCode & (len - 1)`（容量是 2 的幂，位运算代替取模）。
- `threadLocalHashCode` 用魔数 `HASH_INCREMENT = 0x61c88647`（黄金分割比）累加生成，让槽位分布更均匀、减少探测聚集。

## 配图
![开放寻址与线性探测](assets/threadlocal-probe.svg)

## 怎么用（4 个 API）

```java
// 1. 创建（必须是 static final，全类共用同一把 key，避免重复创建撑爆 map）
private static final ThreadLocal<User> currentUser = new ThreadLocal<>();

// 2. 设值 / 取值 / 清除
currentUser.set(user);          // 写入「当前线程」的副本
User u = currentUser.get();     // 读「当前线程」的副本
currentUser.remove();           // 删掉「当前线程」的副本（线程池里必须做！）

// 3. Java 8 起推荐：withInitial 给默认值
private static final ThreadLocal<SimpleDateFormat> df =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));
```

### 典型场景一：Web 请求传递当前登录用户（最常用）
请求从 Controller → Service → DAO 穿过很多层，给每层都加 `User user` 参数太丑。在请求入口（Filter / 拦截器）把登录用户绑到当前线程，业务层直接取，结束清理：

```java
public class UserContext {
    private static final ThreadLocal<LoginUser> CURRENT = new ThreadLocal<>();
    public static void set(LoginUser u) { CURRENT.set(u); }
    public static LoginUser get()        { return CURRENT.get(); }
    public static void clear()           { CURRENT.remove(); } // 关键！
}

// 请求入口
public void doFilter(req, res, chain) {
    UserContext.set(parseToken(req));      // ① 绑到「处理本次请求的线程」
    try { chain.doFilter(req, res); }       // ② 任意层直接取，不用传参
    finally { UserContext.clear(); }        // ③ 必须清理！Web 服务器是线程池
}

// 业务层（埋多深都能直接取）
LoginUser me = UserContext.get();
```

### 典型场景二：非线程安全对象的线程私有化
`SimpleDateFormat` 不是线程安全的，给每个线程一份副本即可：

```java
private static final ThreadLocal<SimpleDateFormat> DATE_FMT =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
String now = DATE_FMT.get().format(new Date()); // 各线程各用各的，安全且不反复 new
```

## 配图
![内存泄漏引用链](assets/threadlocal-leak.svg)

## 内存泄漏深度解析（面试必问）

- **为什么 key 用弱引用？** 当代码里不再持有 `ThreadLocal` 的强引用（置 null / 类卸载），key 能被 GC 回收，避免 key 侧泄漏。它只解决了 key，value 仍是强引用，所以 value 侧还得靠你 `remove()`。弱引用是 JDK 的兜底，不是「可以不 remove」的理由。
- **为什么还会泄漏？** Entry 的 value 是强引用，只要线程还活着（线程池复用），value 就回收不掉，变成 `key=null` 的脏 entry。
- **JDK 的清理是「搭便车」**：`get/set/remove` 会在路过脏 entry 时调用 `expungeStaleEntry` / `cleanSomeSlots` 顺手清理。但如果你之后再也不碰这个 map，脏数据就一直留着。
- **线程池里最危险（双重暴击）**：① 线程复用不销毁，脏 entry 永不被回收；② 下一个任务复用同一线程去 `get()`，可能读到上一个任务的脏 value → **串号 bug**（如 A 的用户身份被 B 拿到）。所以 `try-finally { remove(); }` 是铁律。

### 父子线程传递：InheritableThreadLocal 不够用
`InheritableThreadLocal` 在 `Thread.init()` 时把父线程的值拷给子线程；但线程池里任务是提交给**已存在、被复用的 worker 线程**，不创建子线程，所以它**不会跨任务传递**。需要跨线程池传上下文（traceId、登录态），用阿里开源的 **`TransmittableThreadLocal`（TTL）**——通过 `TtlRunnable`/`TtlCallable` 在提交时捕获、执行前回放、执行后清理。

## 与 synchronized 的本质区别

| 维度 | synchronized | ThreadLocal |
|------|--------------|-------------|
| 思路 | 时间换空间（排队串行） | 空间换时间（每线程一份副本） |
| 并发 | 阻塞等待锁 | 无锁，各自独立 |
| 适用 | 共享可变状态需互斥写 | 变量本就「线程私有」无需共享 |
| 代价 | 上下文切换、死锁风险 | 内存占用、泄漏 / 串号风险 |

一句话：**`synchronized` 解决「多线程抢同一份数据」，`ThreadLocal` 解决「本来就不该共享的数据硬要传来传去」。两者不是替代关系。**

## 可运行示例
项目根目录 `ThreadLocalDemo.java` 演示了「正常隔离」与「线程池忘记 remove 导致串号」两种效果，可直接 `java ThreadLocalDemo.java` 运行。

## 最佳实践
1. **永远 `static final`**：key 应是单例，别每次 new 一个 ThreadLocal。
2. **用完必 `remove()`**，尤其线程池 / Web 请求结束（拦截器 `finally`）。
3. **只存小而必要的数据**，别把大对象、连接长期挂在线程上。
4. **别当全局变量滥用**，能传参就传参，可读性更好。
5. **池化 + 需要跨线程传上下文 → 用 TTL**，别依赖 `InheritableThreadLocal`。

## 易错点 / 面试追问
- **key 为什么是弱引用，不是强引用？** 弱引用让无强引用的 ThreadLocal 能被回收，减少 key 侧泄漏（value 仍需 remove）。
- **只 set 不 remove 会怎样？** 线程池场景：内存泄漏 + 下一个任务读到脏数据（串号）。
- **`InheritableThreadLocal` 和 `ThreadLocal` 区别？** 前者能父传子线程，但池化跨任务不生效，需 TTL。
- **`withInitial` 和 `set` 怎么选？** 有合理默认值用 `withInitial`；没有默认、必须显式设置就用 `set`。
- **内存泄漏的「根因」到底是谁？** value 的强引用链（Thread → ThreadLocalMap → Entry → value）在线程存活时断不掉，弱引用 key 只是兜底。

## 一句话总结
ThreadLocal 是钥匙、数据归线程所有；用法三板斧 `set()` 绑定 → `get()` 取 → `remove()` 清理（线程池场景是铁律），否则泄漏 + 串号。
