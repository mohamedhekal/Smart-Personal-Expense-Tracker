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
        Schema::create('certificate_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('certificate_id')->constrained('bank_certificates')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->date('date');
            $table->date('repayment_date')->nullable();
            $table->boolean('is_repaid')->default(false);
            $table->boolean('is_installment')->default(false);
            $table->unsignedInteger('installment_count')->nullable();
            $table->unsignedInteger('paid_installments')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificate_withdrawals');
    }
};
