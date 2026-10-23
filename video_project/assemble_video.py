import json
import os
import subprocess

def format_ass_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h}:{m:02d}:{s:05.2f}"

def format_srt_time(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def get_duration(file_path):
    cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", file_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return float(res.stdout.strip())

def main():
    with open("video_project/timings.json", "r", encoding="utf-8") as f:
        timings = json.load(f)

    os.makedirs("video_project/processed_scenes", exist_ok=True)
    concat_list = []

    cumulative_time = 0.0
    ass_events = []
    srt_events = []
    srt_counter = 1

    print("Step 1: Processing individual scenes (muxing video + audio)...")
    for i, sc in enumerate(timings):
        scene_id = sc["id"]
        raw_video = f"video_project/raw_videos/{scene_id}.webm"
        audio_file = sc.get("audio_file", f"video_project/audio/{scene_id}.mp3")
        out_mp4 = f"video_project/processed_scenes/{scene_id}.mp4"

        audio_dur = get_duration(audio_file)
        # Target scene duration = audio duration + 0.6s pause
        target_dur = round(audio_dur + 0.6, 2)
        print(f"  [{i+1}/{len(timings)}] {scene_id}: Audio={audio_dur:.2f}s -> Scene Target={target_dur:.2f}s")

        # Encode each scene to 1280x720, 25fps, x264 + aac
        cmd = [
            "ffmpeg", "-y",
            "-i", raw_video,
            "-i", audio_file,
            "-filter_complex",
            f"[0:v]fps=25,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2[v];[1:a]apad=pad_dur=1.5[a]",
            "-map", "[v]",
            "-map", "[a]",
            "-t", str(target_dur),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            out_mp4
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            print(f"Error encoding {scene_id}:", res.stderr[-300:])
            return

        concat_list.append(f"file '{os.path.abspath(out_mp4).replace('\\', '/')}'")

        # Build Subtitles & Chapter Badges
        scene_start = cumulative_time
        scene_end = cumulative_time + target_dur

        # Chapter Pill (Top-Left)
        chapter_title = f"{i+1:02d} | {sc['title'].upper()}"
        ass_events.append(
            f"Dialogue: 0,{format_ass_time(scene_start + 0.2)},{format_ass_time(scene_end - 0.2)},Chapter,,0,0,0,,  {chapter_title}  "
        )

        # Spoken Subtitles (Bottom Center)
        subs = sc.get("subtitles", [sc["text"]])
        sub_dur = (target_dur - 0.4) / len(subs)

        for s_idx, sub_text in enumerate(subs):
            s_start = scene_start + 0.2 + (s_idx * sub_dur)
            s_end = s_start + sub_dur - 0.15

            ass_events.append(
                f"Dialogue: 0,{format_ass_time(s_start)},{format_ass_time(s_end)},Subtitle,,0,0,0,,{sub_text}"
            )

            srt_events.append(
                f"{srt_counter}\n{format_srt_time(s_start)} --> {format_srt_time(s_end)}\n{sub_text}\n"
            )
            srt_counter += 1

        cumulative_time += target_dur

    # Write concat list file
    with open("video_project/concat_list.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(concat_list) + "\n")

    # Step 2: Concatenate all scenes into master video without subtitles
    print("\nStep 2: Concatenating all scenes into unified video...")
    master_raw = "video_project/master_without_subtitles.mp4"
    cmd_concat = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", "video_project/concat_list.txt",
        "-c", "copy",
        master_raw
    ]
    subprocess.run(cmd_concat, check=True)

    # Step 3: Write Master ASS and SRT
    print("\nStep 3: Generating master ASS and SRT subtitle files...")
    ass_header = """[Script Info]
Title: Tutorial AnatomiVerse 3D
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Chapter, Trebuchet MS, 17, &H0000F5FF, &H00000000, &H00083344, &HC0082836, 1, 0, 0, 0, 100, 100, 0, 0, 3, 2, 0, 7, 28, 28, 22, 1
Style: Subtitle, Arial, 21, &H00FFFFFF, &H00000000, &H00090D16, &HE0090D16, 1, 0, 0, 0, 100, 100, 0, 0, 3, 3, 0, 2, 48, 48, 28, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ass_full = ass_header + "\n".join(ass_events) + "\n"
    with open("video_project/master_subtitles.ass", "w", encoding="utf-8") as f:
        f.write(ass_full)

    srt_full = "\n".join(srt_events) + "\n"
    with open("tutorial_anatomi_apotiku.srt", "w", encoding="utf-8") as f:
        f.write(srt_full)
    with open("video_project/master_subtitles.srt", "w", encoding="utf-8") as f:
        f.write(srt_full)

    # Step 4: Burn subtitles into final MP4
    print("\nStep 4: Rendering final video with burned-in subtitles...")
    final_output = "tutorial_anatomi_apotiku.mp4"
    # Escaping path for libass on Windows
    ass_path_escaped = os.path.abspath("video_project/master_subtitles.ass").replace("\\", "/").replace(":", "\\:")
    cmd_burn = [
        "ffmpeg", "-y",
        "-i", master_raw,
        "-vf", f"ass='{ass_path_escaped}'",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "19",
        "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        final_output
    ]
    res_burn = subprocess.run(cmd_burn, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res_burn.returncode != 0:
        print("Error burning subtitles:", res_burn.stderr[-400:])
        return

    final_dur = get_duration(final_output)
    final_size = os.path.getsize(final_output) / (1024 * 1024)
    print("\n========================================================")
    print(f"SUCCESS! Tutorial video created: {final_output}")
    print(f"  Duration: {final_dur:.2f} seconds ({final_dur/60:.1f} minutes)")
    print(f"  File size: {final_size:.2f} MB")
    print(f"  Subtitle file: tutorial_anatomi_apotiku.srt")
    print("========================================================")

if __name__ == "__main__":
    main()
