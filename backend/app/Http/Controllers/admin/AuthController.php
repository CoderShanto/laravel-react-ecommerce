<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    //
    public function authentication(Request $request){

    $validator = Validator::make($request->all(),[
        'email' => 'required|email',
        'password' => 'required'
    ]);
    
    if($validator->fails()){
        return response()->json([
            'status' => 400,
            'errors' => $validator->errors()
        ],400);

    }

    if(Auth::attempt(['email' => $request->email,'password' => $request->password])){

    $user = User::find(Auth::user()->id);
    
    if($user->role == 'admin'){

    $token = $user->createToken('token')->plainTextToken;

    return response()->json([
            'status' => 200,
            'token' => $token,
            'id' =>$user->id,
            'name' => $user->name,
            'message' => 'Admin login successful'
        ],200);

    }else{
         return response()->json([
            'status' => 401,
            'message' => 'You are not authorized to access admin panel'
        ],401);
    }

    }else{
        return response()->json([
            'status' => 401,
            'message' => 'Either email/password is incorrect.'
        ],401);

        
    }


    }

    public function changePassword(Request $request)
{
    $request->validate([
        'current_password' => 'required',
        'new_password' => 'required|min:6|confirmed',
    ]);

    $admin = $request->user(); // sanctum admin token user

    if (!$admin) {
        return response()->json([
            'message' => 'Unauthenticated.'
        ], 401);
    }

    if (!Hash::check($request->current_password, $admin->password)) {
        return response()->json([
            'message' => 'Current password is incorrect.'
        ], 422);
    }

    $admin->password = Hash::make($request->new_password);
    $admin->save();

    return response()->json([
        'message' => 'Password changed successfully.'
    ], 200);
}
}
