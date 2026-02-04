<?php

namespace App\Http\Requests\Mensaje;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMensajeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'para_user_id' => ['required', 'exists:users,id', Rule::notIn([auth()->id()])],
            'contenido'    => ['required', 'string', 'max:2000'],
        ];
    }
}
