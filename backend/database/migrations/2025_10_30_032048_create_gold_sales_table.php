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
        Schema::create('gold_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purchase_id')->nullable()->constrained('gold_purchases')->nullOnDelete();
            $table->decimal('sale_value', 12, 2);
            $table->decimal('price_per_gram', 12, 2)->nullable();
            $table->date('sale_date');
            $table->decimal('profit_loss', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gold_sales');
    }
};
