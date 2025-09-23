from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
import os


API_KEY = os.getenv("GEMINI_API_KEY", "SUA_API_KEY_AQUI")
genai.configure(api_key=API_KEY)


router = APIRouter(prefix="/gemini", tags=["Gemini"])


SYSTEM_MESSAGE = "Você é um assistente especializado em segurança cibernética. Responda sempre de forma clara e objetiva."

# Modelo de entrada


@router.post("/")
def query_gemini(user_input: str):
    model = genai.GenerativeModel("gemini-1.5flash")

    response = model.generate_content(
        [
            {"role": "system", "parts": [SYSTEM_MESSAGE]},
            {"role": "user", "parts": [user_input]}
        ]
    )

    return {"response": response.text}
