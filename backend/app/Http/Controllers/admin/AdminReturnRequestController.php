<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\ReturnRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReturnRequestController extends Controller
{
    public function index(Request $request)
    {
        $q = ReturnRequest::with(['order', 'orderItem', 'user'])->latest();

        if ($status = $request->query('status')) {
            $q->where('status', $status);
        }

        return response()->json($q->paginate(30));
    }

    public function approve(Request $request, ReturnRequest $returnRequest)
    {
        $request->validate([
            'admin_note' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($returnRequest->status !== 'requested') {
            return response()->json(['message' => 'Only requested returns can be approved.'], 422);
        }

        $returnRequest->update([
            'status' => 'approved',
            'admin_note' => $request->admin_note,
            'approved_at' => now(),
        ]);

        return response()->json(['message' => 'Approved', 'return_request' => $returnRequest]);
    }

    public function reject(Request $request, ReturnRequest $returnRequest)
    {
        $request->validate([
            'admin_note' => ['required', 'string', 'max:1000'],
        ]);

        if ($returnRequest->status !== 'requested') {
            return response()->json(['message' => 'Only requested returns can be rejected.'], 422);
        }

        $returnRequest->update([
            'status' => 'rejected',
            'admin_note' => $request->admin_note,
            'rejected_at' => now(),
        ]);

        return response()->json(['message' => 'Rejected', 'return_request' => $returnRequest]);
    }

    public function markReceived(Request $request, ReturnRequest $returnRequest)
    {
        if ($returnRequest->status !== 'approved') {
            return response()->json(['message' => 'Only approved returns can be marked received.'], 422);
        }

        $returnRequest->update([
            'status' => 'received',
            'received_at' => now(),
        ]);

        return response()->json(['message' => 'Marked received', 'return_request' => $returnRequest]);
    }

    public function refund(Request $request, ReturnRequest $returnRequest)
    {
        if (!in_array($returnRequest->status, ['approved', 'received'])) {
            return response()->json(['message' => 'Return must be approved/received before refund.'], 422);
        }

        DB::transaction(function () use ($returnRequest) {

            $orderItem = $returnRequest->orderItem()->lockForUpdate()->first();

            $orderItem->returned_qty = (int)$orderItem->returned_qty + (int)$returnRequest->qty;
            $orderItem->return_reason = $returnRequest->reason;
            $orderItem->returned_at = now();
            $orderItem->save();

            $returnRequest->update([
                'status' => 'refunded',
                'refunded_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Refunded + order item updated',
            'return_request' => $returnRequest
        ]);
    }
}