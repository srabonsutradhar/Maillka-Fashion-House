# Security Specification — মল্লিকা ফ্যাশন হাউস

## 1. Data Invariants
1. Only verified administrators (`srabon10010@gmail.com` with `email_verified == true` or an entry in `/admins/{uid}`) may create, update, or delete `/products/{productId}`, `/storeSettings/{settingId}`, `/quizzes/{quizId}`, and `/quizAnswers/{quizId}`.
2. Public shoppers can only read `/products/{productId}` where `published == true`, `/storeSettings/published`, and `/quizzes/{quizId}` where `active == true`. Unpublished/inactive drafts and `/quizAnswers/{quizId}` secrets are readable ONLY by admins.
3. Each verified user (`/users/{uid}`) may read, create, and update ONLY their own customer profile (`uid == request.auth.uid`, immutable `createdAt`, `updatedAt == request.time`), with no self-assigned role/admin fields.
4. A verified user may claim a coupon in `/users/{uid}/coupons/{quizId}` ONLY once per quiz (`!exists(...)`), ONLY when `/quizAnswers/{quizId}` is `active == true`, and ONLY when `selectedOption == correctOptionIndex` and `discountType`, `discountValue`, `minOrderAmount`, `couponCode` match `/quizAnswers/{quizId}` verbatim.
5. Coupon redemption on `/users/{uid}/coupons/{quizId}` may ONLY transition `used` from `false` to `true` (`usedInOrderId`, `usedAt == request.time`) and can never be reverted or tampered with.
6. Shoppers may create `/orders/{orderId}` with `status == 'নতুন অর্ডার'` and `createdAt == request.time`. If `userId` is present, it must equal `request.auth.uid`. If `couponQuizId` or `discountAmount > 0` is present, the coupon must exist for `request.auth.uid` with `used == false`, be atomically marked `used == true` in the same batch (`getAfter`), and `discountAmount` must not exceed the coupon's configured discount cap while `subtotal >= minOrderAmount`.
7. Customer PII in `/orders/{orderId}` and `/users/{uid}` is strictly isolated to the owning `userId` (`isVerifiedUser()`) or verified administrators.
8. No client may self-assign admin privileges via `/admins/{uid}`.

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated write to `/products/mfh-jamdani-01` with modified `price: 1`.
2. Non-admin user trying to read `/quizAnswers/quiz-jamdani-01` to leak the correct quiz answer.
3. User claiming `/users/uid1/coupons/quiz-jamdani-01` with a wrong `selectedOption` or forged `discountValue: 50000`.
4. User claiming `/users/uid1/coupons/quiz-jamdani-01` a second time after already claiming or using it.
5. User updating `/users/uid1/coupons/quiz-jamdani-01` to reset `used: false` after redemption.
6. User submitting `/orders/order-1` with `discountAmount: 2000` without atomically marking their coupon `used: true` in the same batch.
7. Non-admin user reading `/users/other-uid` or `/orders/other-users-order` (PII leak attempt).
8. User creating `/users/uid1` with an injected ghost/privilege field (`isAdmin: true` or `role: 'admin'`).
9. User updating `/users/uid1` with a forged `createdAt` timestamp or `uid` mutation.
10. Admin email spoofing attempt (`email == 'srabon10010@gmail.com'`, `email_verified: false`) writing to `/quizzes/q1`.
11. Shopper creating an `/orders` document with `status: 'সম্পন্ন'` instead of `'নতুন অর্ডার'`, or forged `createdAt != request.time`.
12. Non-admin user creating `/admins/{uid}` to escalate privileges.
