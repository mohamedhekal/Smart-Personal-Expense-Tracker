<?php

namespace Database\Seeders;

use App\Models\BankCertificate;
use Illuminate\Database\Seeder;

class BankCertificateSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $rows = [
            [
                'bank_name' => 'National Bank',
                'certificate_name' => '3-Year Certificate',
                'certificate_number' => 'CERT-001-XYZ',
                'amount' => 200000,
                'monthly_return' => 2500,
                'return_day_of_month' => 10,
                'last_return_date' => now()->subMonth()->day(10)->toDateString(),
                'max_withdrawal_limit' => 50000,
                'deposit_date' => now()->subYear()->toDateString(),
                'maturity_date' => now()->addYears(2)->toDateString(),
            ],
        ];

        foreach ($rows as $data) {
            BankCertificate::updateOrCreate(
                [
                    'user_id' => $userId,
                    'certificate_name' => $data['certificate_name'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
