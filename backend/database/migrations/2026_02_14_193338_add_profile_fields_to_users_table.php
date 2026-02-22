<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('mobile')->nullable()->after('email');
            $table->text('address')->nullable()->after('mobile');
            $table->string('area')->nullable()->after('address');
            $table->string('city')->nullable()->after('area');
            $table->string('district')->nullable()->after('city');
            $table->string('postal_code')->nullable()->after('district');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'mobile',
                'address',
                'area',
                'city',
                'district',
                'postal_code',
            ]);
        });
    }
};
