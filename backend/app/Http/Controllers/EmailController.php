<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailController extends Controller
{
    public function send(Request $request)
    {
        $validated = $request->validate([
            'to' => ['required', 'email'],
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);
        Mail::raw($validated['body'], function ($message) use ($validated) {
            $message->to($validated['to'])->subject($validated['subject']);
        });
        return response()->json(['success' => true, 'message' => 'Email queued']);
    }
}
