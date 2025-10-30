<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduler: stub recurring tasks (implement jobs/commands later)
Schedule::call(function () {
    Log::info('Run monthly recurring items generation');
})->dailyAt('01:00');

Schedule::call(function () {
    Log::info('Run certificate monthly returns processing');
})->dailyAt('02:00');
