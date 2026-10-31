# Backend API reference

The backend listens on `http://localhost:5001` by default. Set `PORT` to use a
different port. Endpoints that call Gemini require `GEMINI_API_KEY` to be set
in the backend environment.

All successful API responses are JSON. Error responses use the shape
`{ "error": "..." }`.

## `GET /health`

Health check; this endpoint does not require authentication or a request body.

**Success (`200`)**

```json
{
  "status": "ok"
}
```

## `POST /api/transcriptions`

Transcribes an uploaded audio recording.

**Request**

- Content type: `multipart/form-data`
- Required file field: `audio` (one file, up to 25 MB)
- Accepted audio types: FLAC, MP3, MP4/M4A, MPEG, MPGA, OGG, WAV, or WebM

```sh
curl -X POST http://localhost:5001/api/transcriptions \
  -F "audio=@recording.m4a;type=audio/mp4"
```

**Success (`200`)**

```json
{
  "text": "The recognized words from the recording."
}
```

**Errors**

- `400` — The `audio` file is missing.
- `413` — The upload exceeds the file-size limit.
- `415` — The file is not a supported audio type.
- `429` — More than 10 transcription requests were made in 15 minutes.
- `502` — The transcription provider could not process the audio.
- `503` — Gemini is not configured (`GEMINI_API_KEY` is missing).

## `POST /api/assist`

Transcribes audio and generates mobile-help steps in one request. Optional
images provide screen context.

**Request**

- Content type: `multipart/form-data`
- Required file field: `audio` (one supported audio file, up to 25 MB)
- Optional file field: `images` (up to four PNG, JPEG, GIF, or WebP images)
- Each image must be 8 MB or smaller. At most five files can be uploaded.
- Do not send text fields.

```sh
curl -X POST http://localhost:5001/api/assist \
  -F "audio=@request.m4a;type=audio/mp4" \
  -F "images=@screen.png;type=image/png"
```

**Success (`200`)**

```json
{
  "transcription": "The recognized words from the recording.",
  "steps": [
    "Open Settings on your phone.",
    "Tap the option you need."
  ]
}
```

`steps` contains between one and five short instruction strings.

**Errors**

- `400` — The `audio` file is missing or the multipart request is invalid.
- `413` — An upload exceeds its file-size limit, or an image is larger than 8 MB.
- `415` — The audio or an image is not a supported type.
- `429` — More than 10 help requests were made in 15 minutes, or Gemini's
  request quota is exhausted.
- `502` — Gemini could not process the request or returned steps in the wrong
  language.
- `503` — Gemini is not configured (`GEMINI_API_KEY` is missing).

## `POST /api/help`

Generates mobile-help steps from a transcription supplied by the caller.
Optional images can show the phone screen. This endpoint does not transcribe
audio.

**Request**

- Content type: `multipart/form-data`
- Required text field: `transcription` (1–6000 characters)
- Optional file field: `images` (up to four PNG, JPEG, GIF, or WebP images)
- Each image can be up to 8 MB.

```sh
curl -X POST http://localhost:5001/api/help \
  -F "transcription=How do I change my phone's Wi-Fi network?" \
  -F "images=@screen.png;type=image/png"
```

**Success (`200`)**

```json
{
  "steps": [
    "Open Settings on your phone.",
    "Tap Wi-Fi and choose the network you want."
  ]
}
```

`steps` contains between one and five short instruction strings.

**Errors**

- `400` — `transcription` is missing, blank, or longer than 6000 characters.
- `413` — An image exceeds the 8 MB limit.
- `415` — An image is not PNG, JPEG, GIF, or WebP.
- `429` — More than 10 help requests were made in 15 minutes, or Gemini's
  request quota is exhausted.
- `502` — Gemini could not generate help steps or returned steps in the wrong
  language.
- `503` — Gemini is not configured (`GEMINI_API_KEY` is missing).

## Shared behavior and limits

- The transcription endpoint allows 10 requests per IP address per 15 minutes.
  The help and assist endpoints share a separate limit of 10 requests per IP
  address per 15 minutes.
- Upload-limit and validation errors also return the JSON error shape described
  above. Other unexpected server errors return `500` with
  `{ "error": "An unexpected server error occurred." }`.
- Audio and images are temporarily uploaded for processing and removed
  afterward.
