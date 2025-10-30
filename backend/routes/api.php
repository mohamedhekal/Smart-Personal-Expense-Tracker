<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\WithdrawalController;
use App\Http\Controllers\GoldController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\FreelanceRevenueController;
use App\Http\Controllers\FreelancePaymentController;
use App\Http\Controllers\WhatsAppSubscriptionController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\OptimizationController;
use App\Http\Controllers\EmailController;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'user']);

Route::middleware('auth:sanctum')->group(function () {
    // Expenses
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/expenses/{expense}', [ExpenseController::class, 'show']);
    Route::put('/expenses/{expense}', [ExpenseController::class, 'update']);
    Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']);

    // Salaries
    Route::get('/salaries', [SalaryController::class, 'index']);
    Route::post('/salaries', [SalaryController::class, 'store']);
    Route::get('/salaries/{salary}', [SalaryController::class, 'show']);
    Route::put('/salaries/{salary}', [SalaryController::class, 'update']);
    Route::delete('/salaries/{salary}', [SalaryController::class, 'destroy']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    // Expense Categories aliases (to match spec)
    Route::get('/expense-categories', [CategoryController::class, 'index']);
    Route::post('/expense-categories', [CategoryController::class, 'store']);
    Route::delete('/expense-categories/{category}', [CategoryController::class, 'destroy']);

    // Goals
    Route::get('/goals', [GoalController::class, 'index']);
    Route::get('/goals/{goal}', [GoalController::class, 'show']);
    Route::post('/goals', [GoalController::class, 'store']);
    Route::put('/goals/{goal}', [GoalController::class, 'update']);
    Route::delete('/goals/{goal}', [GoalController::class, 'destroy']);
    Route::post('/goals/{goal}/add-amount', [GoalController::class, 'addAmount']);

    // Certificates
    Route::get('/certificates', [CertificateController::class, 'index']);
    Route::get('/certificates/{certificate}', [CertificateController::class, 'show']);
    Route::post('/certificates', [CertificateController::class, 'store']);
    Route::put('/certificates/{certificate}', [CertificateController::class, 'update']);
    Route::delete('/certificates/{certificate}', [CertificateController::class, 'destroy']);

    // Withdrawals
    Route::post('/certificates/{certificate}/withdrawals', [WithdrawalController::class, 'store']);
    Route::get('/certificates/{certificate}/withdrawals', [WithdrawalController::class, 'indexForCertificate']);
    Route::get('/certificate-withdrawals/{withdrawal}', [WithdrawalController::class, 'show']);
    Route::delete('/certificate-withdrawals/{withdrawal}', [WithdrawalController::class, 'destroy']);
    Route::post('/withdrawals/{withdrawal}/repay', [WithdrawalController::class, 'repay']);
    Route::post('/certificate-withdrawals/{withdrawal}/repay', [WithdrawalController::class, 'repay']);
    Route::post('/withdrawals/{withdrawal}/pay-installment', [WithdrawalController::class, 'payInstallment']);

    // Gold
    Route::get('/gold/purchases', [GoldController::class, 'purchasesIndex']);
    Route::get('/gold/purchases/{purchase}', [GoldController::class, 'purchaseShow']);
    Route::post('/gold/purchases', [GoldController::class, 'purchaseStore']);
    Route::put('/gold/purchases/{purchase}', [GoldController::class, 'purchaseUpdate']);
    Route::delete('/gold/purchases/{purchase}', [GoldController::class, 'purchaseDestroy']);
    Route::get('/gold/sales', [GoldController::class, 'salesIndex']);
    Route::get('/gold/sales/{sale}', [GoldController::class, 'saleShow']);
    Route::post('/gold/sales', [GoldController::class, 'saleStore']);
    Route::delete('/gold/sales/{sale}', [GoldController::class, 'saleDestroy']);

    // Activity
    Route::get('/activity', [ActivityLogController::class, 'index']);
    // Aliases + write/delete
    Route::get('/activity-log', [ActivityLogController::class, 'index']);
    Route::post('/activity-log', [ActivityLogController::class, 'store']);
    Route::delete('/activity-log/{activityLog}', [ActivityLogController::class, 'destroy']);
    Route::delete('/activity-log', [ActivityLogController::class, 'clear']);

    // Reminders
    Route::get('/reminders', [ReminderController::class, 'index']);
    Route::get('/reminders/{reminder}', [ReminderController::class, 'show']);
    Route::post('/reminders', [ReminderController::class, 'store']);
    Route::delete('/reminders/{reminder}', [ReminderController::class, 'destroy']);

    // Freelance Revenues
    Route::get('/freelance/revenues', [FreelanceRevenueController::class, 'index']);
    Route::get('/freelance/revenues/{revenue}', [FreelanceRevenueController::class, 'show']);
    Route::post('/freelance/revenues', [FreelanceRevenueController::class, 'store']);
    Route::delete('/freelance/revenues/{revenue}', [FreelanceRevenueController::class, 'destroy']);

    // Freelance Payments
    Route::get('/freelance/payments', [FreelancePaymentController::class, 'index']);
    Route::get('/freelance/payments/{payment}', [FreelancePaymentController::class, 'show']);
    Route::post('/freelance/payments', [FreelancePaymentController::class, 'store']);
    Route::delete('/freelance/payments/{payment}', [FreelancePaymentController::class, 'destroy']);

    // WhatsApp subscriptions
    Route::get('/whatsapp/subscriptions', [WhatsAppSubscriptionController::class, 'index']);
    Route::get('/whatsapp/subscriptions/{subscription}', [WhatsAppSubscriptionController::class, 'show']);
    Route::post('/whatsapp/subscriptions', [WhatsAppSubscriptionController::class, 'store']);
    Route::delete('/whatsapp/subscriptions/{subscription}', [WhatsAppSubscriptionController::class, 'destroy']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/{notification}', [NotificationController::class, 'show']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::get('/settings/{key}', [SettingController::class, 'show']);
    Route::post('/settings', [SettingController::class, 'store']);
    Route::delete('/settings/{key}', [SettingController::class, 'destroy']);

    // Backups
    Route::get('/backups/latest', [BackupController::class, 'latest']);
    Route::get('/backups/{id}', [BackupController::class, 'show']);
    Route::post('/backups/export', [BackupController::class, 'export']);
    Route::post('/backups/import', [BackupController::class, 'import']);
    Route::delete('/backups/{id}', [BackupController::class, 'destroy']);

    // Reports
    Route::get('/reports/overview', [ReportController::class, 'overview']);
    Route::get('/reports/expenses-by-category', [ReportController::class, 'expensesByCategory']);
    Route::get('/reports/monthly-comparison', [ReportController::class, 'monthlyComparison']);
    Route::get('/reports/stats', [ReportController::class, 'stats']);

    // Optimization
    Route::get('/optimization/recommendations', [OptimizationController::class, 'recommendations']);

    // Emails
    Route::post('/emails/send', [EmailController::class, 'send']);
});
