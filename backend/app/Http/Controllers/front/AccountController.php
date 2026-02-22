<?php

namespace App\Http\Controllers\front;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;


class AccountController extends Controller
{
    //
    public function register(Request $request){
        $rules = [
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required',
        ];
        $validator = Validator::make($request->all(),$rules);
        if($validator->fails()){
            return response()->json([
                'status' => 200,
                'errors' => $validator->errors()
            ],200);
        }

        $user = new User();
        $user->name = $request->name;
        $user->email = $request->email;
        $user->password = Hash::make($request->password);
        $user->role = 'customer';
        $user->save();

         return response()->json([
                'status' => 200,
                'message' => 'You have registered successfully.'
            ],200);

    }

    public function authenticate(Request $request){

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
   
    $token = $user->createToken('token')->plainTextToken;

    return response()->json([
            'status' => 200,
            'token' => $token,
            'id' =>$user->id,
            'name' => $user->name
        ],200);

    }else{
        return response()->json([
            'status' => 401,
            'message' => 'Either email/password is incorrect.'
        ],401);

        
    }
    }

 public function profile(Request $request)
{
    $user = $request->user();

    if (!$user) {
        return response()->json([
            'status' => 401,
            'message' => 'Unauthenticated'
        ], 401);
    }

    return response()->json([
        'status' => 200,
        'profile' => $user
    ]);
}


public function updateProfile(Request $request)
{
    $user = $request->user();

    $data = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'mobile' => 'nullable|string|max:30',
        'address' => 'nullable|string',
        'area' => 'nullable|string|max:255',
        'city' => 'nullable|string|max:255',
        'district' => 'nullable|string|max:255',
        'postal_code' => 'nullable|string|max:50',
        'country' => 'nullable|string|max:100',
    ]);

    $user->update($data);

    return response()->json([
        'status' => 200,
        'message' => 'Profile updated successfully',
        'profile' => $user,
    ]);
}

public function changePassword(Request $request)
{
    try {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect.'
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.'
        ], 200);

    } catch (ValidationException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Validation error.',
            'errors' => $e->errors()
        ], 422);
    } catch (\Throwable $e) {
        

        return response()->json([
            'success' => false,
            'message' => 'Server error. Please try again.'
        ], 500);
    }
}
    

}
