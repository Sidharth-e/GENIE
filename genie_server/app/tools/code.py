"""
Code/Developer tools for GENIE Server.

Contains tools useful for developers like code formatting, regex testing, color conversion.
"""
import re
import colorsys
from typing import Any, Dict, List, Optional, Literal

from app import mcp


@mcp.tool()
def test_regex(
    pattern: str,
    test_string: str,
    flags: List[str] = []
) -> Dict[str, Any]:
    """
    Test a regular expression pattern against a string and show matches.
    
    Args:
        pattern: Regular expression pattern to test
        test_string: String to test the pattern against
        flags: Optional list of flags: "i" (ignorecase), "m" (multiline), "s" (dotall)
        
    Returns:
        Match results including captured groups.
    """
    try:
        regex_flags = 0
        if "i" in flags:
            regex_flags |= re.IGNORECASE
        if "m" in flags:
            regex_flags |= re.MULTILINE
        if "s" in flags:
            regex_flags |= re.DOTALL
        
        compiled = re.compile(pattern, regex_flags)
        
        # Find all matches
        all_matches = list(compiled.finditer(test_string))
        
        matches_info = []
        for match in all_matches:
            match_info = {
                "match": match.group(),
                "start": match.start(),
                "end": match.end(),
                "groups": match.groups() if match.groups() else None
            }
            if match.groupdict():
                match_info["named_groups"] = match.groupdict()
            matches_info.append(match_info)
        
        return {
            "pattern": pattern,
            "test_string": test_string[:200] + "..." if len(test_string) > 200 else test_string,
            "valid_pattern": True,
            "match_found": len(matches_info) > 0,
            "match_count": len(matches_info),
            "matches": matches_info
        }
    except re.error as e:
        return {
            "pattern": pattern,
            "valid_pattern": False,
            "error": str(e)
        }


@mcp.tool()
def convert_color(
    color: str,
    to_format: Literal["hex", "rgb", "hsl"] = "hex"
) -> Dict[str, Any]:
    """
    Convert colors between HEX, RGB, and HSL formats.
    
    Args:
        color: Color in any format (e.g., "#FF5733", "rgb(255, 87, 51)", "hsl(11, 100%, 60%)")
        to_format: Target format (hex, rgb, hsl)
        
    Returns:
        Color converted to all formats.
    """
    try:
        r, g, b = 0, 0, 0
        
        # Parse input color
        color = color.strip()
        
        # HEX format
        if color.startswith('#'):
            hex_color = color.lstrip('#')
            if len(hex_color) == 3:
                hex_color = ''.join([c*2 for c in hex_color])
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
        
        # RGB format
        elif color.lower().startswith('rgb'):
            match = re.match(r'rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)', color)
            if match:
                r, g, b = int(match.group(1)), int(match.group(2)), int(match.group(3))
        
        # HSL format
        elif color.lower().startswith('hsl'):
            match = re.match(r'hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?', color)
            if match:
                h = int(match.group(1)) / 360
                s = int(match.group(2)) / 100
                l = int(match.group(3)) / 100
                r, g, b = [int(x * 255) for x in colorsys.hls_to_rgb(h, l, s)]
        
        # Calculate all formats
        hex_color = f"#{r:02x}{g:02x}{b:02x}".upper()
        rgb_color = f"rgb({r}, {g}, {b})"
        
        # Convert to HSL
        h, l, s = colorsys.rgb_to_hls(r/255, g/255, b/255)
        h = int(h * 360)
        s = int(s * 100)
        l = int(l * 100)
        hsl_color = f"hsl({h}, {s}%, {l}%)"
        
        return {
            "input": color,
            "hex": hex_color,
            "rgb": rgb_color,
            "hsl": hsl_color,
            "values": {
                "r": r, "g": g, "b": b,
                "h": h, "s": s, "l": l
            }
        }
    except Exception as e:
        return {"error": f"Could not parse color: {str(e)}"}


@mcp.tool()
def generate_color_palette(
    base_color: str,
    palette_type: Literal["complementary", "analogous", "triadic", "shades"] = "shades"
) -> Dict[str, Any]:
    """
    Generate a color palette based on a base color.
    
    Args:
        base_color: Base color in HEX format (e.g., "#FF5733")
        palette_type: Type of palette to generate
        
    Returns:
        Generated color palette.
    """
    try:
        hex_color = base_color.lstrip('#')
        if len(hex_color) == 3:
            hex_color = ''.join([c*2 for c in hex_color])
        
        r = int(hex_color[0:2], 16) / 255
        g = int(hex_color[2:4], 16) / 255
        b = int(hex_color[4:6], 16) / 255
        
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        
        colors = []
        
        if palette_type == "complementary":
            # Base and complementary (opposite on color wheel)
            colors = [
                (h, l, s),
                ((h + 0.5) % 1, l, s)
            ]
        
        elif palette_type == "analogous":
            # Colors adjacent on the color wheel
            colors = [
                ((h - 0.083) % 1, l, s),
                (h, l, s),
                ((h + 0.083) % 1, l, s)
            ]
        
        elif palette_type == "triadic":
            # Three colors equally spaced
            colors = [
                (h, l, s),
                ((h + 0.333) % 1, l, s),
                ((h + 0.666) % 1, l, s)
            ]
        
        else:  # shades
            # Variations in lightness
            colors = [
                (h, max(0.1, l - 0.3), s),
                (h, max(0.2, l - 0.15), s),
                (h, l, s),
                (h, min(0.8, l + 0.15), s),
                (h, min(0.9, l + 0.3), s)
            ]
        
        # Convert back to HEX
        palette = []
        for hue, light, sat in colors:
            rgb = colorsys.hls_to_rgb(hue, light, sat)
            hex_val = "#{:02x}{:02x}{:02x}".format(
                int(rgb[0] * 255),
                int(rgb[1] * 255),
                int(rgb[2] * 255)
            ).upper()
            palette.append(hex_val)
        
        return {
            "base_color": base_color,
            "palette_type": palette_type,
            "colors": palette,
            "count": len(palette)
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def escape_string(
    text: str,
    escape_type: Literal["html", "json", "regex", "sql", "url"] = "html"
) -> Dict[str, str]:
    """
    Escape special characters in a string for various contexts.
    
    Args:
        text: Text to escape
        escape_type: Type of escaping (html, json, regex, sql, url)
        
    Returns:
        Escaped string.
    """
    import json as json_module
    import urllib.parse
    
    result = text
    
    if escape_type == "html":
        replacements = [
            ('&', '&amp;'),
            ('<', '&lt;'),
            ('>', '&gt;'),
            ('"', '&quot;'),
            ("'", '&#x27;'),
        ]
        for old, new in replacements:
            result = result.replace(old, new)
    
    elif escape_type == "json":
        result = json_module.dumps(text)[1:-1]  # Remove surrounding quotes
    
    elif escape_type == "regex":
        special_chars = r'\.^$*+?{}[]|()/'
        for char in special_chars:
            result = result.replace(char, '\\' + char)
    
    elif escape_type == "sql":
        result = result.replace("'", "''")
        result = result.replace("\\", "\\\\")
    
    elif escape_type == "url":
        result = urllib.parse.quote(text)
    
    return {
        "original": text,
        "escaped": result,
        "escape_type": escape_type
    }


@mcp.tool()
def diff_text(text1: str, text2: str) -> Dict[str, Any]:
    """
    Compare two texts and show the differences.
    
    Args:
        text1: First text for comparison
        text2: Second text for comparison
        
    Returns:
        Diff information including added, removed, and unchanged parts.
    """
    lines1 = text1.splitlines()
    lines2 = text2.splitlines()
    
    # Simple line-by-line diff
    added = []
    removed = []
    unchanged = 0
    
    max_lines = max(len(lines1), len(lines2))
    
    for i in range(max_lines):
        line1 = lines1[i] if i < len(lines1) else None
        line2 = lines2[i] if i < len(lines2) else None
        
        if line1 == line2:
            unchanged += 1
        else:
            if line1 and line1 not in lines2:
                removed.append({"line": i + 1, "content": line1})
            if line2 and line2 not in lines1:
                added.append({"line": i + 1, "content": line2})
    
    return {
        "lines_in_text1": len(lines1),
        "lines_in_text2": len(lines2),
        "unchanged_lines": unchanged,
        "added_lines": added,
        "removed_lines": removed,
        "total_changes": len(added) + len(removed)
    }


@mcp.tool()
def minify_json(json_string: str) -> Dict[str, Any]:
    """
    Minify a JSON string by removing whitespace.
    
    Args:
        json_string: JSON string to minify
        
    Returns:
        Minified JSON string.
    """
    import json as json_module
    
    try:
        parsed = json_module.loads(json_string)
        minified = json_module.dumps(parsed, separators=(',', ':'))
        
        original_size = len(json_string)
        minified_size = len(minified)
        saved = original_size - minified_size
        
        return {
            "valid": True,
            "minified": minified,
            "original_size": original_size,
            "minified_size": minified_size,
            "bytes_saved": saved,
            "reduction_percent": round((saved / original_size) * 100, 1) if original_size > 0 else 0
        }
    except json_module.JSONDecodeError as e:
        return {
            "valid": False,
            "error": str(e)
        }


@mcp.tool()
def count_code_lines(
    code: str,
    language: Literal["python", "javascript", "java", "cpp", "generic"] = "generic"
) -> Dict[str, Any]:
    """
    Count lines of code, comments, and blank lines.
    
    Args:
        code: Source code to analyze
        language: Programming language for comment detection
        
    Returns:
        Line count statistics.
    """
    lines = code.splitlines()
    
    total_lines = len(lines)
    blank_lines = sum(1 for line in lines if not line.strip())
    
    # Comment patterns by language
    single_comment = {"python": "#", "javascript": "//", "java": "//", "cpp": "//", "generic": "//"}
    
    comment_char = single_comment.get(language, "//")
    comment_lines = sum(1 for line in lines if line.strip().startswith(comment_char))
    
    code_lines = total_lines - blank_lines - comment_lines
    
    return {
        "total_lines": total_lines,
        "code_lines": code_lines,
        "comment_lines": comment_lines,
        "blank_lines": blank_lines,
        "comment_ratio": round((comment_lines / max(total_lines, 1)) * 100, 1),
        "language": language
    }


@mcp.tool()
def generate_color_from_text(text: str) -> Dict[str, str]:
    """
    Generate a consistent color from any text (useful for avatars, tags, etc.).
    
    Args:
        text: Text to generate color from
        
    Returns:
        Generated color in multiple formats.
    """
    import hashlib
    
    # Create a hash of the text
    hash_obj = hashlib.md5(text.encode())
    hash_hex = hash_obj.hexdigest()
    
    # Use first 6 characters for color
    hex_color = f"#{hash_hex[:6].upper()}"
    
    # Convert to RGB
    r = int(hash_hex[0:2], 16)
    g = int(hash_hex[2:4], 16)
    b = int(hash_hex[4:6], 16)
    
    # Calculate luminance to determine if text should be light or dark
    luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    text_color = "#000000" if luminance > 0.5 else "#FFFFFF"
    
    return {
        "input_text": text,
        "background_color": hex_color,
        "text_color": text_color,
        "rgb": f"rgb({r}, {g}, {b})"
    }
