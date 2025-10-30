<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Upsert the requested user (ID 4)
        User::updateOrCreate(
            ['id' => 4],
            [
                'name' => 'Mohamed Hekal',
                'email' => 'mohamed.k.hekal@gmail.com',
                'password' => Hash::make('741852963'),
                'email_verified_at' => now(),
            ]
        );
    }
}
