

## Problem
`LiveEarningsTracker.tsx` এ `displayItems` তৈরি করার সময় earnings array কে 4 বার duplicate করা হচ্ছে (line ~193):
```
const displayItems = earnings.length > 1 ? [...earnings, ...earnings, ...earnings, ...earnings] : earnings;
```
এটা scrolling animation এর জন্য করা হয়েছিল, কিন্তু এর ফলে প্রতিটা offer 4 বার দেখা যাচ্ছে।

## Plan
1. **`src/components/LiveEarningsTracker.tsx`**: `displayItems` line পরিবর্তন করে শুধু `earnings` ব্যবহার করা — duplicate সরিয়ে দেওয়া।
2. CSS animation (`animate-scroll-left`) ঠিকমতো কাজ করতে infinite scroll effect এর জন্য শুধু 2x duplicate করা যেতে পারে (1 copy scrolls out, next copy scrolls in), অথবা সম্পূর্ণ duplicate বাদ দেওয়া যেতে পারে যদি user চায় offer গুলো একবারই দেখাক।

**Approach**: Duplicate সম্পূর্ণ বাদ দিয়ে `displayItems = earnings` করা। এতে প্রতিটা offer একবারই দেখাবে।

