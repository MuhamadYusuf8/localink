<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Catalog\ProductCatalogController;
use App\Http\Controllers\Catalog\FarmerCatalogController;
use App\Http\Controllers\Farmer\FarmerDashboardController;
use App\Http\Controllers\Farmer\FarmerProductController;
use App\Http\Controllers\Farmer\FarmerOrderController;
use App\Http\Controllers\Buyer\CartController;
use App\Http\Controllers\Buyer\CheckoutController;
use App\Http\Controllers\Buyer\BuyerOrderController;
use App\Http\Controllers\Webhook\MidtransWebhookController;
use App\Http\Controllers\Messaging\MessageController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\MediaController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ─────────────────────────────────────────────────────────
    // AUTHENTICATION ROUTES
    // ─────────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('register/farmer', [AuthController::class, 'registerFarmer']);
        Route::post('register/buyer', [AuthController::class, 'registerBuyer']);
        Route::post('login', [AuthController::class, 'login']);
        Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail']);
        Route::post('password/forgot', [AuthController::class, 'forgotPassword']);
        Route::post('password/reset', [AuthController::class, 'resetPassword']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
            Route::post('email/resend', [AuthController::class, 'resendVerification']);
        });
    });

    // ─────────────────────────────────────────────────────────
    // PUBLIC CATALOG ROUTES
    // ─────────────────────────────────────────────────────────
    Route::prefix('catalog')->group(function () {
        Route::get('categories', [ProductCatalogController::class, 'categories']);
        Route::get('products', [ProductCatalogController::class, 'index']);
        Route::get('products/{farmerSlug}/{productSlug}', [ProductCatalogController::class, 'show']);
        
        Route::get('farmers', [FarmerCatalogController::class, 'index']);
        Route::get('farmers/nearby', [FarmerCatalogController::class, 'nearby']);
        Route::get('farmers/{slug}', [FarmerCatalogController::class, 'show']);
    });

    // ─────────────────────────────────────────────────────────
    // WEBHOOKS
    // ─────────────────────────────────────────────────────────
    Route::post('webhooks/midtrans', [MidtransWebhookController::class, 'handle']);

    // ─────────────────────────────────────────────────────────
    // PROTECTED ROUTES
    // ─────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // MEDIA UPLOAD
        Route::post('media/upload', [MediaController::class, 'upload']);

        // MESSAGING (Bisa Buyer / Farmer)
        Route::prefix('conversations')->group(function () {
            Route::get('/', [MessageController::class, 'index']);
            Route::post('/', [MessageController::class, 'storeConversation']);
            Route::get('{id}/messages', [MessageController::class, 'show']);
            Route::post('{id}/messages', [MessageController::class, 'sendMessage']);
        });

        // 👨‍🌾 FARMER ROUTES
        Route::middleware('role:farmer')->prefix('farmer')->group(function () {
            // Dashboard & Analytics
            Route::get('dashboard/stats', [FarmerDashboardController::class, 'stats']);
            
            // Product Management
            Route::apiResource('products', FarmerProductController::class);
            Route::post('products/{id}/publish', [FarmerProductController::class, 'togglePublish']);
            Route::get('products/{id}/price-check', [FarmerProductController::class, 'priceCheck']);
            Route::post('products/{id}/promote', [FarmerProductController::class, 'promote']);

            // Order Management
            Route::get('orders', [FarmerOrderController::class, 'index']);
            Route::get('orders/{id}', [FarmerOrderController::class, 'show']);
            Route::patch('orders/{id}/status', [FarmerOrderController::class, 'updateStatus']);
        });

        // 🛒 BUYER ROUTES
        Route::middleware('role:buyer,farmer')->prefix('buyer')->group(function () {
            // Cart
            Route::get('cart', [CartController::class, 'index']);
            Route::post('cart/items', [CartController::class, 'addItem']);
            Route::patch('cart/items/{id}', [CartController::class, 'updateItem']);
            Route::delete('cart/items/{id}', [CartController::class, 'removeItem']);
            
            // Checkout
            Route::post('checkout', [CheckoutController::class, 'checkout']);
            
            // Order History
            Route::get('orders', [BuyerOrderController::class, 'index']);
            Route::get('orders/{id}', [BuyerOrderController::class, 'show']);
            Route::post('orders/{id}/cancel', [BuyerOrderController::class, 'cancel']);
            Route::post('orders/{id}/complete', [BuyerOrderController::class, 'complete']);

            // Addresses
            Route::get('addresses', [\App\Http\Controllers\Buyer\AddressController::class, 'index']);
            Route::post('addresses', [\App\Http\Controllers\Buyer\AddressController::class, 'store']);
            Route::delete('addresses/{id}', [\App\Http\Controllers\Buyer\AddressController::class, 'destroy']);
        });

        // 👑 ADMIN ROUTES
        Route::middleware('role:admin')->prefix('admin')->group(function () {
            Route::get('dashboard/stats', [AdminDashboardController::class, 'stats']);
            Route::get('users', [AdminDashboardController::class, 'users']);
            Route::post('users/{id}/suspend', [AdminDashboardController::class, 'suspendUser']);
        });
    });

});
