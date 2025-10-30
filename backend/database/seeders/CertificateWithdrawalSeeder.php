<?php

namespace Database\Seeders;

use App\Models\BankCertificate;
use App\Models\CertificateWithdrawal;
use Illuminate\Database\Seeder;

class CertificateWithdrawalSeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $certificate = BankCertificate::where('user_id', $userId)->first();
        if (!$certificate) {
            return;
        }

        $rows = [
            [
                'certificate_id' => $certificate->id,
                'amount' => 10000,
                'date' => now()->subMonths(2)->toDateString(),
                'repayment_date' => now()->addMonths(1)->toDateString(),
                'is_repaid' => false,
                'is_installment' => true,
                'installment_count' => 5,
                'paid_installments' => 2,
            ],
        ];

        foreach ($rows as $data) {
            CertificateWithdrawal::updateOrCreate(
                [
                    'user_id' => $userId,
                    'certificate_id' => $data['certificate_id'],
                    'date' => $data['date'],
                ],
                $data + ['user_id' => $userId]
            );
        }
    }
}
