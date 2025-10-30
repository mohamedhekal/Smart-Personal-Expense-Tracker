<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        $items = Setting::where('user_id', $request->user()->id)->get();
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function show(Request $request, string $key)
    {
        $item = Setting::where('user_id', $request->user()->id)->where('key', $key)->first();
        return response()->json(['success' => true, 'data' => $item]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
        ]);
        foreach ($validated['settings'] as $key => $value) {
            Setting::updateOrCreate(
                ['user_id' => $request->user()->id, 'key' => $key],
                ['value' => is_scalar($value) ? (string)$value : json_encode($value)]
            );
        }
        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, string $key)
    {
        Setting::where('user_id', $request->user()->id)->where('key', $key)->delete();
        return response()->json(['success' => true]);
    }
}
