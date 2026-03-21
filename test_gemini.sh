#!/bin/bash
if [ -f .env ]; then
  source .env
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY not found in .env"
  exit 1
fi

test_model() {
  local model=$1
  echo "Testing model: $model"
  local status_code=$(curl -s -o response_body.txt -w "%{http_code}" -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
      "contents": [{
        "parts": [{"text": "Hello"}]
      }]
    }')
  
  echo "Status code: $status_code"
  if [ "$status_code" -ne 200 ]; then
    echo "Error response:"
    cat response_body.txt | head -n 20
  else
    echo "Success!"
  fi
  echo "----------------------------------------"
}

list_models() {
  echo "Listing models..."
  curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}" | grep "\"name\""
  echo "----------------------------------------"
}

list_models
test_model_with_tool() {
  local model=$1
  echo "Testing model with grounding: $model"
  local status_code=$(curl -s -o response_body.txt -w "%{http_code}" -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
      "contents": [{
        "parts": [{"text": "What is the capital of France?"}]
      }],
      "tools": [{
        "googleSearchRetrieval": {
          "dynamicRetrievalConfig": {
            "mode": "MODE_DYNAMIC",
            "dynamicThreshold": 0.3
          }
        }
      }]
    }')
  
  echo "Status code: $status_code"
  if [ "$status_code" -ne 200 ]; then
    echo "Error response:"
    cat response_body.txt | head -n 20
  else
    echo "Success!"
  fi
  echo "----------------------------------------"
}

test_model_with_new_tool() {
  local model=$1
  echo "Testing model with google_search tool: $model"
  local status_code=$(curl -s -o response_body.txt -w "%{http_code}" -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{
      "contents": [{
        "parts": [{"text": "What is the capital of France?"}]
      }],
      "tools": [{
        "google_search": {}
      }]
    }')
  
  echo "Status code: $status_code"
  if [ "$status_code" -ne 200 ]; then
    echo "Error response:"
    cat response_body.txt | head -n 20
  else
    echo "Success!"
  fi
  echo "----------------------------------------"
}

test_model_with_new_tool "gemini-2.5-flash"
rm response_body.txt