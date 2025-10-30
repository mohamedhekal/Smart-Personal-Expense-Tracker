<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $userId = 4;
        $categories = [
            ['name' => 'Food', 'icon' => '🍔', 'color' => '#FF8A65', 'is_default' => true],
            ['name' => 'Transport', 'icon' => '🚌', 'color' => '#4DB6AC', 'is_default' => true],
            ['name' => 'Bills', 'icon' => '💡', 'color' => '#9575CD', 'is_default' => true],
            ['name' => 'Shopping', 'icon' => '🛍️', 'color' => '#F06292', 'is_default' => false],
        ];

        foreach ($categories as $data) {
            ExpenseCategory::updateOrCreate(
                [
                    'user_id' => $userId,
                    'name' => $data['name'],
                ],
                [
                    'icon' => $data['icon'] ?? null,
                    'color' => $data['color'] ?? null,
                    'is_default' => $data['is_default'] ?? false,
                ]
            );
        }
    }
}
