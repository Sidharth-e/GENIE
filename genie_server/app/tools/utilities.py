"""
Utility tools for GENIE Server.

Contains practical everyday utility tools like calculations, conversions, and generators.
"""
import hashlib
import random
import string
import uuid
import base64
import json
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Literal, Optional

from app import mcp


# ============================================================================
# TEXT & STRING TOOLS
# ============================================================================

@mcp.tool()
def generate_password(
    length: int = 16,
    include_uppercase: bool = True,
    include_lowercase: bool = True,
    include_numbers: bool = True,
    include_symbols: bool = True
) -> Dict[str, Any]:
    """
    Generate a secure random password with customizable options.
    
    Args:
        length: Password length (8-128 characters)
        include_uppercase: Include uppercase letters (A-Z)
        include_lowercase: Include lowercase letters (a-z)
        include_numbers: Include digits (0-9)
        include_symbols: Include special characters (!@#$%^&*)
        
    Returns:
        Generated password with strength analysis.
    """
    if length < 8:
        length = 8
    elif length > 128:
        length = 128
    
    chars = ""
    if include_uppercase:
        chars += string.ascii_uppercase
    if include_lowercase:
        chars += string.ascii_lowercase
    if include_numbers:
        chars += string.digits
    if include_symbols:
        chars += "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    if not chars:
        chars = string.ascii_letters + string.digits
    
    password = ''.join(random.SystemRandom().choice(chars) for _ in range(length))
    
    # Calculate strength
    strength_score = 0
    if any(c.isupper() for c in password): strength_score += 1
    if any(c.islower() for c in password): strength_score += 1
    if any(c.isdigit() for c in password): strength_score += 1
    if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password): strength_score += 1
    if length >= 12: strength_score += 1
    if length >= 16: strength_score += 1
    
    strength = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"][min(strength_score, 5)]
    
    return {
        "password": password,
        "length": length,
        "strength": strength,
        "strength_score": f"{strength_score}/6"
    }


@mcp.tool()
def generate_uuid(version: Literal["v4", "v1"] = "v4", count: int = 1) -> Dict[str, Any]:
    """
    Generate UUID(s) - universally unique identifiers.
    
    Args:
        version: UUID version - "v4" (random) or "v1" (time-based)
        count: Number of UUIDs to generate (1-50)
        
    Returns:
        List of generated UUIDs.
    """
    count = max(1, min(count, 50))
    
    uuids = []
    for _ in range(count):
        if version == "v1":
            uuids.append(str(uuid.uuid1()))
        else:
            uuids.append(str(uuid.uuid4()))
    
    return {
        "uuids": uuids,
        "version": version,
        "count": len(uuids)
    }


@mcp.tool()
def hash_text(
    text: str,
    algorithm: Literal["md5", "sha1", "sha256", "sha512"] = "sha256"
) -> Dict[str, str]:
    """
    Generate a hash of the given text using various algorithms.
    
    Args:
        text: The text to hash
        algorithm: Hash algorithm to use (md5, sha1, sha256, sha512)
        
    Returns:
        Hash digest in hexadecimal format.
    """
    text_bytes = text.encode('utf-8')
    
    if algorithm == "md5":
        hash_obj = hashlib.md5(text_bytes)
    elif algorithm == "sha1":
        hash_obj = hashlib.sha1(text_bytes)
    elif algorithm == "sha512":
        hash_obj = hashlib.sha512(text_bytes)
    else:
        hash_obj = hashlib.sha256(text_bytes)
    
    return {
        "original_text": text[:100] + "..." if len(text) > 100 else text,
        "algorithm": algorithm,
        "hash": hash_obj.hexdigest()
    }


@mcp.tool()
def encode_base64(text: str, decode: bool = False) -> Dict[str, str]:
    """
    Encode text to Base64 or decode Base64 to text.
    
    Args:
        text: Text to encode, or Base64 string to decode
        decode: If True, decode Base64 to text; if False, encode text to Base64
        
    Returns:
        Encoded or decoded result.
    """
    try:
        if decode:
            decoded = base64.b64decode(text).decode('utf-8')
            return {
                "operation": "decode",
                "input": text[:100] + "..." if len(text) > 100 else text,
                "result": decoded
            }
        else:
            encoded = base64.b64encode(text.encode('utf-8')).decode('utf-8')
            return {
                "operation": "encode",
                "input": text[:100] + "..." if len(text) > 100 else text,
                "result": encoded
            }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def word_count(text: str) -> Dict[str, Any]:
    """
    Analyze text and return word count, character count, and other statistics.
    
    Args:
        text: The text to analyze
        
    Returns:
        Comprehensive text statistics.
    """
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    paragraphs = text.split('\n\n')
    paragraphs = [p.strip() for p in paragraphs if p.strip()]
    
    return {
        "characters": len(text),
        "characters_no_spaces": len(text.replace(" ", "").replace("\n", "")),
        "words": len(words),
        "sentences": len(sentences),
        "paragraphs": len(paragraphs),
        "average_word_length": round(sum(len(w) for w in words) / max(len(words), 1), 2),
        "reading_time_minutes": round(len(words) / 200, 1),  # Average reading speed
        "speaking_time_minutes": round(len(words) / 130, 1)  # Average speaking speed
    }


# ============================================================================
# MATH & CALCULATION TOOLS
# ============================================================================

@mcp.tool()
def calculate_percentage(value: float, total: float) -> Dict[str, Any]:
    """
    Calculate what percentage a value is of a total.
    
    Args:
        value: The part value
        total: The whole/total value
        
    Returns:
        Percentage calculation with formatted result.
    """
    if total == 0:
        return {"error": "Total cannot be zero"}
    
    percentage = (value / total) * 100
    
    return {
        "value": value,
        "total": total,
        "percentage": round(percentage, 2),
        "formatted": f"{percentage:.2f}%",
        "fraction": f"{value}/{total}"
    }


@mcp.tool()
def calculate_discount(
    original_price: float,
    discount_percent: float = None,
    final_price: float = None
) -> Dict[str, Any]:
    """
    Calculate discount - either the final price from a discount %, or the discount % from prices.
    
    Args:
        original_price: The original price before discount
        discount_percent: The discount percentage (provide this OR final_price)
        final_price: The price after discount (provide this OR discount_percent)
        
    Returns:
        Complete discount calculation details.
    """
    if discount_percent is not None:
        savings = original_price * (discount_percent / 100)
        final = original_price - savings
        return {
            "original_price": original_price,
            "discount_percent": discount_percent,
            "savings": round(savings, 2),
            "final_price": round(final, 2)
        }
    elif final_price is not None:
        savings = original_price - final_price
        discount = (savings / original_price) * 100
        return {
            "original_price": original_price,
            "final_price": final_price,
            "savings": round(savings, 2),
            "discount_percent": round(discount, 2)
        }
    else:
        return {"error": "Provide either discount_percent or final_price"}


@mcp.tool()
def calculate_tip(
    bill_amount: float,
    tip_percent: float = 18,
    split_ways: int = 1
) -> Dict[str, Any]:
    """
    Calculate tip amount and total bill, optionally split between people.
    
    Args:
        bill_amount: The bill amount before tip
        tip_percent: Tip percentage (default 18%)
        split_ways: Number of people to split the bill (default 1)
        
    Returns:
        Tip calculation with per-person amounts if splitting.
    """
    if split_ways < 1:
        split_ways = 1
    
    tip_amount = bill_amount * (tip_percent / 100)
    total = bill_amount + tip_amount
    
    result = {
        "bill_amount": bill_amount,
        "tip_percent": tip_percent,
        "tip_amount": round(tip_amount, 2),
        "total": round(total, 2)
    }
    
    if split_ways > 1:
        result["split_ways"] = split_ways
        result["per_person_bill"] = round(bill_amount / split_ways, 2)
        result["per_person_tip"] = round(tip_amount / split_ways, 2)
        result["per_person_total"] = round(total / split_ways, 2)
    
    return result


@mcp.tool()
def calculate_bmi(weight_kg: float, height_cm: float) -> Dict[str, Any]:
    """
    Calculate Body Mass Index (BMI) from weight and height.
    
    Args:
        weight_kg: Weight in kilograms
        height_cm: Height in centimeters
        
    Returns:
        BMI value with category classification.
    """
    if height_cm <= 0 or weight_kg <= 0:
        return {"error": "Weight and height must be positive values"}
    
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25:
        category = "Normal weight"
    elif bmi < 30:
        category = "Overweight"
    else:
        category = "Obese"
    
    return {
        "weight_kg": weight_kg,
        "height_cm": height_cm,
        "bmi": round(bmi, 1),
        "category": category
    }


@mcp.tool()
def calculate_loan(
    principal: float,
    annual_rate: float,
    months: int
) -> Dict[str, Any]:
    """
    Calculate monthly loan payment and total interest.
    
    Args:
        principal: Loan amount
        annual_rate: Annual interest rate (e.g., 5.5 for 5.5%)
        months: Loan term in months
        
    Returns:
        Monthly payment, total payment, and total interest.
    """
    if months <= 0 or principal <= 0:
        return {"error": "Principal and months must be positive values"}
    
    if annual_rate == 0:
        monthly_payment = principal / months
        total_payment = principal
        total_interest = 0
    else:
        monthly_rate = annual_rate / 100 / 12
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate)**months) / ((1 + monthly_rate)**months - 1)
        total_payment = monthly_payment * months
        total_interest = total_payment - principal
    
    return {
        "principal": principal,
        "annual_rate": f"{annual_rate}%",
        "term_months": months,
        "monthly_payment": round(monthly_payment, 2),
        "total_payment": round(total_payment, 2),
        "total_interest": round(total_interest, 2)
    }


# ============================================================================
# UNIT CONVERSION TOOLS
# ============================================================================

@mcp.tool()
def convert_temperature(
    value: float,
    from_unit: Literal["celsius", "fahrenheit", "kelvin"],
    to_unit: Literal["celsius", "fahrenheit", "kelvin"]
) -> Dict[str, Any]:
    """
    Convert temperature between Celsius, Fahrenheit, and Kelvin.
    
    Args:
        value: Temperature value to convert
        from_unit: Source unit (celsius, fahrenheit, kelvin)
        to_unit: Target unit (celsius, fahrenheit, kelvin)
        
    Returns:
        Converted temperature value.
    """
    # Convert to Celsius first
    if from_unit == "fahrenheit":
        celsius = (value - 32) * 5/9
    elif from_unit == "kelvin":
        celsius = value - 273.15
    else:
        celsius = value
    
    # Convert from Celsius to target
    if to_unit == "fahrenheit":
        result = celsius * 9/5 + 32
    elif to_unit == "kelvin":
        result = celsius + 273.15
    else:
        result = celsius
    
    return {
        "original": f"{value}°{from_unit[0].upper()}",
        "converted": round(result, 2),
        "formatted": f"{round(result, 2)}°{to_unit[0].upper()}"
    }


@mcp.tool()
def convert_length(
    value: float,
    from_unit: Literal["mm", "cm", "m", "km", "inch", "foot", "yard", "mile"],
    to_unit: Literal["mm", "cm", "m", "km", "inch", "foot", "yard", "mile"]
) -> Dict[str, Any]:
    """
    Convert length between metric and imperial units.
    
    Args:
        value: Length value to convert
        from_unit: Source unit
        to_unit: Target unit
        
    Returns:
        Converted length value.
    """
    # Conversion to meters
    to_meters = {
        "mm": 0.001, "cm": 0.01, "m": 1, "km": 1000,
        "inch": 0.0254, "foot": 0.3048, "yard": 0.9144, "mile": 1609.34
    }
    
    meters = value * to_meters[from_unit]
    result = meters / to_meters[to_unit]
    
    return {
        "original": f"{value} {from_unit}",
        "converted": round(result, 6),
        "formatted": f"{round(result, 6)} {to_unit}"
    }


@mcp.tool()
def convert_weight(
    value: float,
    from_unit: Literal["mg", "g", "kg", "oz", "lb", "ton"],
    to_unit: Literal["mg", "g", "kg", "oz", "lb", "ton"]
) -> Dict[str, Any]:
    """
    Convert weight between metric and imperial units.
    
    Args:
        value: Weight value to convert
        from_unit: Source unit
        to_unit: Target unit
        
    Returns:
        Converted weight value.
    """
    # Conversion to grams
    to_grams = {
        "mg": 0.001, "g": 1, "kg": 1000,
        "oz": 28.3495, "lb": 453.592, "ton": 907185
    }
    
    grams = value * to_grams[from_unit]
    result = grams / to_grams[to_unit]
    
    return {
        "original": f"{value} {from_unit}",
        "converted": round(result, 6),
        "formatted": f"{round(result, 6)} {to_unit}"
    }


@mcp.tool()
def convert_data_size(
    value: float,
    from_unit: Literal["B", "KB", "MB", "GB", "TB", "PB"],
    to_unit: Literal["B", "KB", "MB", "GB", "TB", "PB"]
) -> Dict[str, Any]:
    """
    Convert data size between bytes, kilobytes, megabytes, gigabytes, terabytes, and petabytes.
    
    Args:
        value: Data size value to convert
        from_unit: Source unit (B, KB, MB, GB, TB, PB)
        to_unit: Target unit (B, KB, MB, GB, TB, PB)
        
    Returns:
        Converted data size value.
    """
    # Conversion to bytes
    to_bytes = {
        "B": 1, "KB": 1024, "MB": 1024**2, 
        "GB": 1024**3, "TB": 1024**4, "PB": 1024**5
    }
    
    bytes_val = value * to_bytes[from_unit]
    result = bytes_val / to_bytes[to_unit]
    
    return {
        "original": f"{value} {from_unit}",
        "converted": round(result, 6),
        "formatted": f"{round(result, 6)} {to_unit}"
    }


# ============================================================================
# DATE & TIME TOOLS
# ============================================================================

@mcp.tool()
def get_current_datetime(
    timezone_offset_hours: int = 0,
    format: Literal["iso", "readable", "unix"] = "readable"
) -> Dict[str, Any]:
    """
    Get the current date and time with optional timezone offset.
    
    Args:
        timezone_offset_hours: Hours offset from UTC (e.g., 5.5 for IST, -5 for EST)
        format: Output format - iso, readable, or unix timestamp
        
    Returns:
        Current datetime in requested format.
    """
    now = datetime.utcnow() + timedelta(hours=timezone_offset_hours)
    
    result = {
        "utc_offset": f"UTC{'+' if timezone_offset_hours >= 0 else ''}{timezone_offset_hours}",
        "unix_timestamp": int(now.timestamp())
    }
    
    if format == "iso":
        result["datetime"] = now.isoformat()
    elif format == "unix":
        result["datetime"] = int(now.timestamp())
    else:
        result["datetime"] = now.strftime("%A, %B %d, %Y at %I:%M:%S %p")
        result["date"] = now.strftime("%Y-%m-%d")
        result["time"] = now.strftime("%H:%M:%S")
    
    return result


@mcp.tool()
def calculate_date_difference(
    date1: str,
    date2: str
) -> Dict[str, Any]:
    """
    Calculate the difference between two dates.
    
    Args:
        date1: First date in YYYY-MM-DD format
        date2: Second date in YYYY-MM-DD format
        
    Returns:
        Difference in days, weeks, months, and years.
    """
    try:
        d1 = datetime.strptime(date1, "%Y-%m-%d")
        d2 = datetime.strptime(date2, "%Y-%m-%d")
        
        diff = abs((d2 - d1).days)
        
        return {
            "date1": date1,
            "date2": date2,
            "difference": {
                "days": diff,
                "weeks": round(diff / 7, 1),
                "months": round(diff / 30.44, 1),
                "years": round(diff / 365.25, 2)
            },
            "is_date2_after_date1": d2 > d1
        }
    except ValueError as e:
        return {"error": f"Invalid date format. Use YYYY-MM-DD. Error: {str(e)}"}


@mcp.tool()
def add_days_to_date(
    date: str,
    days: int
) -> Dict[str, Any]:
    """
    Add or subtract days from a date.
    
    Args:
        date: Starting date in YYYY-MM-DD format
        days: Number of days to add (negative to subtract)
        
    Returns:
        Resulting date after adding/subtracting days.
    """
    try:
        d = datetime.strptime(date, "%Y-%m-%d")
        result = d + timedelta(days=days)
        
        return {
            "original_date": date,
            "days_added": days,
            "result_date": result.strftime("%Y-%m-%d"),
            "result_formatted": result.strftime("%A, %B %d, %Y"),
            "day_of_week": result.strftime("%A")
        }
    except ValueError as e:
        return {"error": f"Invalid date format. Use YYYY-MM-DD. Error: {str(e)}"}


# ============================================================================
# JSON & DATA TOOLS
# ============================================================================

@mcp.tool()
def format_json(json_string: str, indent: int = 2) -> Dict[str, Any]:
    """
    Format/prettify a JSON string for better readability.
    
    Args:
        json_string: Raw JSON string to format
        indent: Number of spaces for indentation (default 2)
        
    Returns:
        Formatted JSON string.
    """
    try:
        parsed = json.loads(json_string)
        formatted = json.dumps(parsed, indent=indent, sort_keys=True)
        
        return {
            "valid": True,
            "formatted": formatted,
            "keys_count": len(parsed) if isinstance(parsed, dict) else None,
            "items_count": len(parsed) if isinstance(parsed, list) else None
        }
    except json.JSONDecodeError as e:
        return {
            "valid": False,
            "error": str(e)
        }


@mcp.tool()
def generate_lorem_ipsum(
    paragraphs: int = 1,
    words_per_paragraph: int = 50
) -> Dict[str, Any]:
    """
    Generate Lorem Ipsum placeholder text.
    
    Args:
        paragraphs: Number of paragraphs to generate (1-10)
        words_per_paragraph: Approximate words per paragraph (10-200)
        
    Returns:
        Generated Lorem Ipsum text.
    """
    paragraphs = max(1, min(paragraphs, 10))
    words_per_paragraph = max(10, min(words_per_paragraph, 200))
    
    lorem_words = [
        "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
        "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
        "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
        "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
        "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
        "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
        "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
        "deserunt", "mollit", "anim", "id", "est", "laborum"
    ]
    
    result_paragraphs = []
    for _ in range(paragraphs):
        words = [random.choice(lorem_words) for _ in range(words_per_paragraph)]
        words[0] = words[0].capitalize()
        para = ' '.join(words) + '.'
        result_paragraphs.append(para)
    
    return {
        "text": '\n\n'.join(result_paragraphs),
        "paragraphs": paragraphs,
        "total_words": paragraphs * words_per_paragraph
    }
