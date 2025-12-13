"""
Web/Internet tools for GENIE Server.

Contains tools for web-related operations like URL parsing, QR codes, and web data.
"""
import re
import urllib.parse
from typing import Any, Dict, List, Optional
from datetime import datetime
import json

from app import mcp


@mcp.tool()
def parse_url(url: str) -> Dict[str, Any]:
    """
    Parse a URL and extract its components (protocol, domain, path, query params, etc.).
    
    Args:
        url: The URL to parse
        
    Returns:
        Parsed URL components including protocol, domain, path, query parameters.
    """
    try:
        parsed = urllib.parse.urlparse(url)
        query_params = dict(urllib.parse.parse_qsl(parsed.query))
        
        return {
            "valid": True,
            "original_url": url,
            "scheme": parsed.scheme or "https",
            "domain": parsed.netloc,
            "path": parsed.path or "/",
            "query_string": parsed.query,
            "query_params": query_params,
            "fragment": parsed.fragment,
            "port": parsed.port
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}


@mcp.tool()
def build_url(
    base_url: str,
    path: str = "",
    query_params: Dict[str, str] = {}
) -> Dict[str, str]:
    """
    Build a URL from components (base URL, path, and query parameters).
    
    Args:
        base_url: The base URL (e.g., "https://api.example.com")
        path: Optional path to append (e.g., "/users/123")
        query_params: Optional dictionary of query parameters
        
    Returns:
        The constructed URL.
    """
    # Ensure base_url doesn't end with slash if path starts with one
    if base_url.endswith('/') and path.startswith('/'):
        base_url = base_url[:-1]
    elif not base_url.endswith('/') and path and not path.startswith('/'):
        path = '/' + path
    
    full_url = base_url + path
    
    if query_params:
        query_string = urllib.parse.urlencode(query_params)
        full_url = f"{full_url}?{query_string}"
    
    return {
        "url": full_url,
        "base": base_url,
        "path": path,
        "params_count": len(query_params)
    }


@mcp.tool()
def encode_url(text: str, decode: bool = False) -> Dict[str, str]:
    """
    URL encode or decode a string.
    
    Args:
        text: Text to encode/decode
        decode: If True, decode URL-encoded string; if False, encode the string
        
    Returns:
        Encoded or decoded result.
    """
    try:
        if decode:
            result = urllib.parse.unquote(text)
            return {
                "operation": "decode",
                "input": text,
                "result": result
            }
        else:
            result = urllib.parse.quote(text, safe='')
            return {
                "operation": "encode",
                "input": text,
                "result": result
            }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
def extract_emails(text: str) -> Dict[str, Any]:
    """
    Extract all email addresses from a given text.
    
    Args:
        text: Text to search for email addresses
        
    Returns:
        List of found email addresses.
    """
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = list(set(re.findall(email_pattern, text)))
    
    return {
        "emails": emails,
        "count": len(emails),
        "unique": True
    }


@mcp.tool()
def extract_urls(text: str) -> Dict[str, Any]:
    """
    Extract all URLs from a given text.
    
    Args:
        text: Text to search for URLs
        
    Returns:
        List of found URLs.
    """
    url_pattern = r'https?://[^\s<>"\'{}|\\^`\[\]]+'
    urls = list(set(re.findall(url_pattern, text)))
    
    # Categorize URLs
    categorized = {
        "http": [],
        "https": []
    }
    for url in urls:
        if url.startswith("https://"):
            categorized["https"].append(url)
        else:
            categorized["http"].append(url)
    
    return {
        "urls": urls,
        "count": len(urls),
        "secure_count": len(categorized["https"]),
        "insecure_count": len(categorized["http"])
    }


@mcp.tool()
def validate_email(email: str) -> Dict[str, Any]:
    """
    Validate if a string is a properly formatted email address.
    
    Args:
        email: Email address to validate
        
    Returns:
        Validation result with details.
    """
    # Basic email pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    is_valid = bool(re.match(pattern, email))
    
    result = {
        "email": email,
        "valid": is_valid
    }
    
    if is_valid:
        parts = email.split('@')
        result["local_part"] = parts[0]
        result["domain"] = parts[1]
    else:
        # Provide feedback on why it might be invalid
        issues = []
        if '@' not in email:
            issues.append("Missing @ symbol")
        elif email.count('@') > 1:
            issues.append("Multiple @ symbols")
        if email.startswith('.') or email.endswith('.'):
            issues.append("Cannot start or end with a period")
        if '..' in email:
            issues.append("Cannot have consecutive periods")
        result["issues"] = issues
    
    return result


@mcp.tool()
def generate_qr_data(
    content: str,
    qr_type: str = "url"
) -> Dict[str, Any]:
    """
    Generate QR code data structure that can be rendered by frontend.
    
    Args:
        content: Content to encode in QR code
        qr_type: Type of QR code (url, text, email, phone, wifi, vcard)
        
    Returns:
        QR code data structure for frontend rendering.
    """
    formatted_content = content
    
    if qr_type == "email":
        formatted_content = f"mailto:{content}"
    elif qr_type == "phone":
        formatted_content = f"tel:{content}"
    elif qr_type == "url" and not content.startswith(('http://', 'https://')):
        formatted_content = f"https://{content}"
    
    return {
        "_type": "qr_code",
        "content": formatted_content,
        "raw_content": content,
        "qr_type": qr_type,
        "size": 256,  # Default size in pixels
        "description": f"QR Code for {qr_type}: {content[:50]}..."
    }


@mcp.tool()
def extract_hashtags(text: str) -> Dict[str, Any]:
    """
    Extract all hashtags from a given text.
    
    Args:
        text: Text to search for hashtags
        
    Returns:
        List of found hashtags.
    """
    hashtag_pattern = r'#[a-zA-Z0-9_]+'
    hashtags = list(set(re.findall(hashtag_pattern, text)))
    
    return {
        "hashtags": hashtags,
        "count": len(hashtags),
        "without_symbol": [h[1:] for h in hashtags]
    }


@mcp.tool()
def extract_mentions(text: str) -> Dict[str, Any]:
    """
    Extract all @mentions from a given text.
    
    Args:
        text: Text to search for mentions
        
    Returns:
        List of found mentions.
    """
    mention_pattern = r'@[a-zA-Z0-9_]+'
    mentions = list(set(re.findall(mention_pattern, text)))
    
    return {
        "mentions": mentions,
        "count": len(mentions),
        "usernames": [m[1:] for m in mentions]
    }


@mcp.tool()
def analyze_domain(domain: str) -> Dict[str, Any]:
    """
    Analyze a domain name and extract information about it.
    
    Args:
        domain: Domain name to analyze (e.g., "www.example.co.uk")
        
    Returns:
        Domain analysis including TLD, subdomain, etc.
    """
    # Remove protocol if present
    domain = re.sub(r'^https?://', '', domain)
    # Remove path if present
    domain = domain.split('/')[0]
    
    parts = domain.split('.')
    
    # Common TLDs including country codes
    common_tlds = ['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'app', 'dev']
    
    result = {
        "full_domain": domain,
        "parts": parts,
        "is_subdomain": len(parts) > 2
    }
    
    if len(parts) >= 2:
        result["tld"] = parts[-1]
        result["domain_name"] = parts[-2]
        
        if len(parts) > 2:
            result["subdomain"] = '.'.join(parts[:-2])
    
    # Check if it might be a two-part TLD (like .co.uk)
    if len(parts) >= 3 and parts[-2] in ['co', 'com', 'net', 'org', 'gov', 'ac', 'edu']:
        result["possible_ccTLD"] = f"{parts[-2]}.{parts[-1]}"
    
    return result


@mcp.tool()
def slugify(text: str, separator: str = "-") -> Dict[str, str]:
    """
    Convert text to a URL-friendly slug.
    
    Args:
        text: Text to convert to slug
        separator: Character to use as separator (default: "-")
        
    Returns:
        URL-friendly slug.
    """
    # Convert to lowercase
    slug = text.lower()
    
    # Replace spaces and underscores with separator
    slug = re.sub(r'[\s_]+', separator, slug)
    
    # Remove special characters
    slug = re.sub(r'[^a-z0-9\-]', '', slug)
    
    # Remove multiple consecutive separators
    slug = re.sub(f'{separator}+', separator, slug)
    
    # Remove leading/trailing separators
    slug = slug.strip(separator)
    
    return {
        "original": text,
        "slug": slug,
        "separator": separator,
        "length": len(slug)
    }
