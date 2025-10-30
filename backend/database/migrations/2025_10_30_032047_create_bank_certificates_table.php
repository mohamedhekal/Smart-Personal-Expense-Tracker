<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bank_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('bank_name');
            $table->string('certificate_name');
            $table->string('certificate_number')->nullable();
            $table->decimal('amount', 14, 2);
            $table->decimal('monthly_return', 12, 2)->default(0);
            $table->unsignedTinyInteger('return_day_of_month')->nullable();
            $table->date('last_return_date')->nullable();
            $table->decimal('max_withdrawal_limit', 14, 2)->nullable();
            $table->date('deposit_date')->nullable();
            $table->date('maturity_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_certificates');
    }
};
