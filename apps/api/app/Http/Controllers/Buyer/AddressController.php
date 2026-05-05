<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/buyer/addresses
     */
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()
            ->orderBy('is_default', 'desc')
            ->get();
        
        return $this->success($addresses);
    }

    /**
     * POST /api/v1/buyer/addresses
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label'          => 'required|string|max:100',
            'recipient_name' => 'required|string|max:255',
            'phone'          => 'required|string|max:20',
            'address'        => 'required|string',
            'province'       => 'required|string|max:100',
            'city'           => 'required|string|max:100',
            'district'       => 'required|string|max:100',
            'postal_code'    => 'nullable|string|max:10',
            'is_primary'     => 'nullable|boolean',
        ]);

        $userId = $request->user()->id;

        // Jika is_primary true, set yang lain jadi false
        if ($request->is_primary) {
            Address::where('user_id', $userId)->update(['is_default' => false]);
        }

        $address = Address::create([
            'user_id'        => $userId,
            'label'          => $validated['label'],
            'recipient_name' => $validated['recipient_name'],
            'phone'          => $validated['phone'],
            'full_address'   => $validated['address'],
            'province'       => $validated['province'],
            'city'           => $validated['city'],
            'district'       => $validated['district'],
            'postal_code'    => $validated['postal_code'] ?? '',
            'is_default'     => (bool)($validated['is_primary'] ?? false),
        ]);

        return $this->created($address);
    }

    /**
     * DELETE /api/v1/buyer/addresses/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $address = $request->user()->addresses()->findOrFail($id);
        $address->delete();

        return $this->success(null, 'Alamat berhasil dihapus.');
    }
}
