<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\FarmerProfile;
use App\Models\BuyerProfile;
use App\Models\Address;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\MarketPrice;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ProductCategorySeeder::class,
            UserSeeder::class,
            ProductSeeder::class,
            MarketPriceSeeder::class,
        ]);
    }
}

// ─────────────────────────────────────────────────────────
// ProductCategorySeeder
// ─────────────────────────────────────────────────────────
class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Sayuran',  'slug' => 'sayuran',  'icon_url' => null, 'sort_order' => 1],
            ['name' => 'Buah',     'slug' => 'buah',     'icon_url' => null, 'sort_order' => 2],
            ['name' => 'Beras & Serealia', 'slug' => 'beras', 'icon_url' => null, 'sort_order' => 3],
            ['name' => 'Rempah-Rempah',    'slug' => 'rempah', 'icon_url' => null, 'sort_order' => 4],
            ['name' => 'Umbi-Umbian',       'slug' => 'umbi',  'icon_url' => null, 'sort_order' => 5],
            ['name' => 'Hasil Ternak',      'slug' => 'ternak', 'icon_url' => null, 'sort_order' => 6],
        ];

        foreach ($categories as $cat) {
            ProductCategory::firstOrCreate(['slug' => $cat['slug']], $cat);
        }

        // Sub-kategori Sayuran
        $sayuran = ProductCategory::where('slug', 'sayuran')->first();
        $subSayuran = [
            ['name' => 'Daun-Daunan',  'slug' => 'sayuran-daun',   'sort_order' => 1],
            ['name' => 'Buah Sayur',   'slug' => 'buah-sayur',     'sort_order' => 2],
            ['name' => 'Akar & Umbi',  'slug' => 'sayuran-umbi',   'sort_order' => 3],
        ];
        foreach ($subSayuran as $sub) {
            ProductCategory::firstOrCreate(
                ['slug' => $sub['slug']],
                array_merge($sub, ['parent_id' => $sayuran->id])
            );
        }
    }
}

// ─────────────────────────────────────────────────────────
// UserSeeder — 5 petani, 3 pembeli, 1 admin (Fokus Sumatera Barat)
// ─────────────────────────────────────────────────────────
class UserSeeder extends Seeder
{
    private array $farmers = [
        [
            'name'       => 'Haji Syamsul',
            'email'      => 'syamsul@petani.test',
            'phone'      => '081234567801',
            'store_name' => 'Kebun Sayur Solok',
            'slug'       => 'kebun-sayur-solok',
            'bio'        => 'Petani sayuran dari Solok. Menyediakan tomat, cabai merah keriting asli Minang, dan selada segar.',
            'province'   => 'Sumatera Barat',
            'city'       => 'Kabupaten Solok',
            'district'   => 'Lembah Gumanti',
            'latitude'   => -1.0264,
            'longitude'  => 100.8066,
            'tier'       => 'pro',
            'rating'     => 4.85,
            'sales'      => 1240,
        ],
        [
            'name'       => 'Bundo Kanduang',
            'email'      => 'bundo@petani.test',
            'phone'      => '081234567802',
            'store_name' => 'Beras Solok Asli',
            'slug'       => 'beras-solok-asli',
            'bio'        => 'Penghasil beras Solok premium (Anak Daro dan Cisokan). Kualitas terjamin, langsung dari sawah.',
            'province'   => 'Sumatera Barat',
            'city'       => 'Kota Solok',
            'district'   => 'Lubuk Sikarah',
            'latitude'   => -0.7958,
            'longitude'  => 100.6601,
            'tier'       => 'basic',
            'rating'     => 4.92,
            'sales'      => 1876,
        ],
        [
            'name'       => 'Uda Rizal',
            'email'      => 'rizal@petani.test',
            'phone'      => '081234567803',
            'store_name' => 'Rempah Bukit Tinggi',
            'slug'       => 'rempah-bukit-tinggi',
            'bio'        => 'Perkebunan rempah-rempah di lereng Gunung Singgalang. Kayu manis, cengkeh, dan kapulaga.',
            'province'   => 'Sumatera Barat',
            'city'       => 'Kota Bukittinggi',
            'district'   => 'Mandiangin Koto Selayan',
            'latitude'   => -0.2974,
            'longitude'  => 100.3686,
            'tier'       => 'pro',
            'rating'     => 4.91,
            'sales'      => 2100,
        ],
        [
            'name'       => 'Pak Datuk',
            'email'      => 'datuk@petani.test',
            'phone'      => '081234567804',
            'store_name' => 'Agro Manggis Payakumbuh',
            'slug'       => 'agro-manggis-payakumbuh',
            'bio'        => 'Spesialis buah manggis dan durian kualitas ekspor dari Payakumbuh.',
            'province'   => 'Sumatera Barat',
            'city'       => 'Kota Payakumbuh',
            'district'   => 'Payakumbuh Barat',
            'latitude'   => -0.2285,
            'longitude'  => 100.6300,
            'tier'       => 'basic',
            'rating'     => 4.68,
            'sales'      => 543,
        ],
        [
            'name'       => 'Andi Koto',
            'email'      => 'andi@petani.test',
            'phone'      => '081234567805',
            'store_name' => 'Hidroponik Padang',
            'slug'       => 'hidroponik-padang',
            'bio'        => 'Pusat sayuran hidroponik di tengah Kota Padang. Segar, bersih, panen harian.',
            'province'   => 'Sumatera Barat',
            'city'       => 'Kota Padang',
            'district'   => 'Koto Tangah',
            'latitude'   => -0.8490,
            'longitude'  => 100.3475,
            'tier'       => 'free',
            'rating'     => 4.55,
            'sales'      => 312,
        ],
    ];

    private array $buyers = [
        [
            'name'        => 'Rumah Makan Sederhana Padang',
            'email'       => 'rm_sederhana@buyer.test',
            'phone'       => '081298765401',
            'buyer_type'  => 'wholesale',
            'company_name'=> 'RM Sederhana Pusat',
            'district'    => 'Padang Barat',
        ],
        [
            'name'        => 'Uni Fitri',
            'email'       => 'fitri@buyer.test',
            'phone'       => '081298765402',
            'buyer_type'  => 'retail',
            'company_name'=> null,
            'district'    => 'Padang Timur',
        ],
        [
            'name'        => 'Pasar Swalayan Minang',
            'email'       => 'swalayan@buyer.test',
            'phone'       => '081298765403',
            'buyer_type'  => 'wholesale',
            'company_name'=> 'PT Minang Mart',
            'district'    => 'Lubuk Begalung',
        ],
    ];

    public function run(): void
    {
        // Buat petani
        foreach ($this->farmers as $farmerData) {
            $user = User::firstOrCreate(
                ['email' => $farmerData['email']],
                [
                    'name'       => $farmerData['name'],
                    'phone'      => $farmerData['phone'],
                    'password'   => Hash::make('password123'),
                    'role'       => 'farmer',
                    'is_verified'=> true,
                    'email_verified_at' => now(),
                ]
            );

            FarmerProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'store_name'      => $farmerData['store_name'],
                    'slug'            => $farmerData['slug'],
                    'bio'             => $farmerData['bio'],
                    'province'        => $farmerData['province'],
                    'city'            => $farmerData['city'],
                    'district'        => $farmerData['district'],
                    'location_label'  => "{$farmerData['district']}, {$farmerData['city']}",
                    'latitude'        => $farmerData['latitude'],
                    'longitude'       => $farmerData['longitude'],
                    'subscription_tier' => $farmerData['tier'],
                    'is_premium'      => in_array($farmerData['tier'], ['basic', 'pro']),
                    'average_rating'  => $farmerData['rating'],
                    'rating_count'    => rand(50, 500),
                    'total_sales'     => $farmerData['sales'],
                ]
            );
        }

        // Buat pembeli
        foreach ($this->buyers as $buyerData) {
            $user = User::firstOrCreate(
                ['email' => $buyerData['email']],
                [
                    'name'     => $buyerData['name'],
                    'phone'    => $buyerData['phone'],
                    'password' => Hash::make('password123'),
                    'role'     => 'buyer',
                    'is_verified' => true,
                    'email_verified_at' => now(),
                ]
            );

            BuyerProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'buyer_type'   => $buyerData['buyer_type'],
                    'company_name' => $buyerData['company_name'],
                ]
            );

            // Tambah alamat default pembeli (Fokus Kota Padang)
            Address::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'label'          => 'Alamat Utama',
                    'recipient_name' => $buyerData['name'],
                    'phone'          => $buyerData['phone'],
                    'full_address'   => 'Jl. Khatib Sulaiman No. 88, RT 02/RW 01',
                    'province'       => 'Sumatera Barat',
                    'city'           => 'Kota Padang',
                    'district'       => $buyerData['district'],
                    'postal_code'    => '25133',
                    'is_default'     => true,
                ]
            );
        }

        // Admin
        User::firstOrCreate(
            ['email' => 'admin@economic-survival.id'],
            [
                'name'       => 'Administrator',
                'password'   => Hash::make('admin_secure_123'),
                'role'       => 'admin',
                'is_verified'=> true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('✅ Users & Profiles (Sumatera Barat) selesai di-seed.');
    }
}

// ─────────────────────────────────────────────────────────
// ProductSeeder — produk demo per petani
// ─────────────────────────────────────────────────────────
class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categoryMap = ProductCategory::pluck('id', 'slug');
        $farmerMap   = FarmerProfile::with('user')->get()->keyBy('slug');

        $products = [
            // Haji Syamsul (Solok)
            [
                'farmer_slug'    => 'kebun-sayur-solok',
                'category_slug'  => 'sayuran',
                'name'           => 'Cabai Merah Keriting',
                'slug'           => 'cabai-merah-keriting',
                'description'    => '# Cabai Merah Keriting\n\nCabai merah segar pilihan langsung dari Alahan Panjang, Solok. Sangat cocok untuk masakan Padang.',
                'unit'           => 'kg',
                'retail_price'   => 55000,
                'wholesale_price'=> 48000,
                'wholesale_min_qty' => 5,
                'stock_qty'      => 150,
                'tags'           => ['cabai', 'solok', 'pedas'],
                'status'         => 'active',
                'is_published'   => true,
                'is_featured'    => true,
                'rating'         => 4.9,
                'sold_count'     => 340,
            ],
            // Bundo Kanduang (Solok Beras)
            [
                'farmer_slug'    => 'beras-solok-asli',
                'category_slug'  => 'beras',
                'name'           => 'Beras Solok Anak Daro',
                'slug'           => 'beras-solok-anak-daro',
                'description'    => 'Beras Solok varietas Anak Daro asli. Nasi yang dihasilkan pera namun pulen, sangat disukai untuk rumah makan.',
                'unit'           => 'karung (10kg)',
                'retail_price'   => 160000,
                'wholesale_price'=> 145000,
                'wholesale_min_qty' => 10,
                'stock_qty'      => 500,
                'tags'           => ['beras', 'solok', 'anak-daro'],
                'status'         => 'active',
                'is_published'   => true,
                'rating'         => 4.95,
                'sold_count'     => 890,
            ],
            // Uda Rizal (Bukittinggi Rempah)
            [
                'farmer_slug'    => 'rempah-bukit-tinggi',
                'category_slug'  => 'rempah',
                'name'           => 'Kayu Manis Kerinci/Bukittinggi',
                'slug'           => 'kayu-manis-premium',
                'description'    => 'Kayu manis (Cassia Vera) grade ekspor.',
                'unit'           => 'kg',
                'retail_price'   => 85000,
                'wholesale_price'=> 75000,
                'wholesale_min_qty' => 5,
                'stock_qty'      => 80,
                'tags'           => ['kayu-manis', 'rempah'],
                'status'         => 'active',
                'is_published'   => true,
                'rating'         => 4.85,
                'sold_count'     => 120,
            ],
            // Pak Datuk (Payakumbuh Buah)
            [
                'farmer_slug'    => 'agro-manggis-payakumbuh',
                'category_slug'  => 'buah',
                'name'           => 'Manggis Ekspor Payakumbuh',
                'slug'           => 'manggis-ekspor-payakumbuh',
                'description'    => 'Manggis manis tanpa getah kuning, kualitas ekspor super.',
                'unit'           => 'kg',
                'retail_price'   => 35000,
                'wholesale_price'=> 28000,
                'wholesale_min_qty' => 20,
                'stock_qty'      => 300,
                'tags'           => ['manggis', 'payakumbuh'],
                'status'         => 'active',
                'is_published'   => true,
                'rating'         => 4.7,
                'sold_count'     => 430,
            ],
            // Andi Koto (Padang Hidroponik)
            [
                'farmer_slug'    => 'hidroponik-padang',
                'category_slug'  => 'sayuran',
                'name'           => 'Selada Air Hidroponik',
                'slug'           => 'selada-air-hidroponik-pdg',
                'description'    => 'Selada air hidroponik segar, bebas pestisida.',
                'unit'           => 'ikat',
                'retail_price'   => 6000,
                'stock_qty'      => 100,
                'tags'           => ['selada', 'hidroponik', 'padang'],
                'status'         => 'active',
                'is_published'   => true,
                'rating'         => 4.6,
                'sold_count'     => 280,
            ],
        ];

        foreach ($products as $p) {
            $farmer = $farmerMap->get($p['farmer_slug']);
            if (!$farmer) continue;

            $catId = $categoryMap->get($p['category_slug']);

            Product::firstOrCreate(
                ['farmer_id' => $farmer->id, 'slug' => $p['slug']],
                [
                    'category_id'       => $catId,
                    'name'              => $p['name'],
                    'slug'              => $p['slug'],
                    'description'       => $p['description'],
                    'unit'              => $p['unit'],
                    'retail_price'      => $p['retail_price'],
                    'wholesale_price'   => $p['wholesale_price'] ?? null,
                    'wholesale_min_qty' => $p['wholesale_min_qty'] ?? null,
                    'stock_qty'         => $p['stock_qty'],
                    'images'            => [
                        ['url' => "https://picsum.photos/seed/{$p['slug']}/800/600", 'alt' => $p['name'], 'is_primary' => true],
                    ],
                    'harvest_date'   => $p['harvest_date'] ?? null,
                    'tags'           => $p['tags'],
                    'status'         => $p['status'],
                    'is_published'   => $p['is_published'],
                    'is_featured'    => $p['is_featured'] ?? false,
                    'average_rating' => $p['rating'],
                    'rating_count'   => rand(20, 300),
                    'sold_count'     => $p['sold_count'],
                ]
            );
        }

        $this->command->info('✅ Produk demo Sumatera Barat selesai di-seed.');
    }
}

// ─────────────────────────────────────────────────────────
// MarketPriceSeeder — harga pasar Sumatera Barat
// ─────────────────────────────────────────────────────────
class MarketPriceSeeder extends Seeder
{
    public function run(): void
    {
        $sayuranId = ProductCategory::where('slug', 'sayuran')->value('id');
        $berasId   = ProductCategory::where('slug', 'beras')->value('id');

        $prices = [
            ['category_id' => $sayuranId, 'product_name' => 'Cabai Merah Keriting', 'region' => 'Sumatera Barat',  'price_low' => 45000,  'price_high' => 60000, 'price_avg' => 52000],
            ['category_id' => $berasId,   'product_name' => 'Beras Anak Daro',      'region' => 'Sumatera Barat',  'price_low' => 150000, 'price_high' => 170000,'price_avg' => 160000],
        ];

        foreach ($prices as $price) {
            if (!$price['category_id']) continue;

            MarketPrice::create(array_merge($price, [
                'source'        => 'Dinas Pertanian Sumbar',
                'recorded_date' => now()->toDateString(),
            ]));
        }

        $this->command->info('✅ Harga pasar Sumbar selesai di-seed.');
    }
}
