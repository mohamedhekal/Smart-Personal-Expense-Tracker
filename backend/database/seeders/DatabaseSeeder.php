<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ExpenseCategorySeeder::class,
            ExpenseSeeder::class,
            SalarySeeder::class,
            FinancialGoalSeeder::class,
            BankCertificateSeeder::class,
            CertificateWithdrawalSeeder::class,
            GoldPurchaseSeeder::class,
            GoldSaleSeeder::class,
            ActivityLogSeeder::class,
            ReminderSeeder::class,
            FreelanceRevenueSeeder::class,
            FreelancePaymentSeeder::class,
            WhatsAppSubscriptionSeeder::class,
            NotificationSeeder::class,
            SettingSeeder::class,
        ]);
    }
}
