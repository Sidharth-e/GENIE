"""
Visualization tools for GENIE Server.

Generates structured chart data in a format that the frontend can render interactively.
All tools return a specific JSON format that the UI knows how to interpret.
"""
from typing import List, Optional, Dict, Any, Literal
from app import mcp


# Chart type constants
CHART_PIE = "pie"
CHART_BAR = "bar"
CHART_LINE = "line"
CHART_DOUGHNUT = "doughnut"
CHART_RADAR = "radar"


def _create_chart_response(
    chart_type: str,
    title: str,
    data: Dict[str, Any],
    options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a standardized chart response format.
    
    The frontend should parse this format and render the chart using
    a library like Chart.js, Recharts, or similar.
    """
    return {
        "_type": "chart",  # Signal to frontend that this is chart data
        "chartType": chart_type,
        "title": title,
        "data": data,
        "options": options or {},
    }


@mcp.tool()
def generate_pie_chart(
    labels: List[str],
    values: List[float],
    title: str = "Pie Chart",
    colors: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generate interactive pie chart data for visualization.
    
    Args:
        labels: List of labels for each slice (e.g., ["Sales", "Marketing", "R&D"])
        values: List of numeric values for each slice (e.g., [45, 30, 25])
        title: Chart title
        colors: Optional list of hex colors (e.g., ["#FF6384", "#36A2EB", "#FFCE56"])
        
    Returns:
        Structured chart data that the UI can render as an interactive pie chart.
    """
    if len(labels) != len(values):
        return {"error": "Labels and values must have the same length"}
    
    # Default color palette
    default_colors = [
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
        "#FF9F40", "#E7E9ED", "#7C4DFF", "#00E676", "#FF5252"
    ]
    
    chart_colors = colors or default_colors[:len(labels)]
    
    data = {
        "labels": labels,
        "datasets": [{
            "data": values,
            "backgroundColor": chart_colors,
            "borderColor": ["#ffffff"] * len(labels),
            "borderWidth": 2,
        }]
    }
    
    options = {
        "responsive": True,
        "plugins": {
            "legend": {"position": "right"},
            "tooltip": {"enabled": True}
        }
    }
    
    return _create_chart_response(CHART_PIE, title, data, options)


@mcp.tool()
def generate_bar_chart(
    labels: List[str],
    values: List[float],
    title: str = "Bar Chart",
    dataset_label: str = "Values",
    color: str = "#36A2EB",
    horizontal: bool = False
) -> Dict[str, Any]:
    """
    Generate interactive bar chart data for visualization.
    
    Args:
        labels: List of category labels (e.g., ["Jan", "Feb", "Mar"])
        values: List of numeric values for each category
        title: Chart title
        dataset_label: Label for the dataset (shown in legend)
        color: Bar color as hex (e.g., "#36A2EB")
        horizontal: If True, renders as horizontal bar chart
        
    Returns:
        Structured chart data that the UI can render as an interactive bar chart.
    """
    if len(labels) != len(values):
        return {"error": "Labels and values must have the same length"}
    
    data = {
        "labels": labels,
        "datasets": [{
            "label": dataset_label,
            "data": values,
            "backgroundColor": color,
            "borderColor": color,
            "borderWidth": 1,
        }]
    }
    
    options = {
        "indexAxis": "y" if horizontal else "x",
        "responsive": True,
        "plugins": {
            "legend": {"display": True},
            "tooltip": {"enabled": True}
        },
        "scales": {
            "y": {"beginAtZero": True}
        }
    }
    
    return _create_chart_response(CHART_BAR, title, data, options)


@mcp.tool()
def generate_line_chart(
    labels: List[str],
    datasets: List[Dict[str, Any]],
    title: str = "Line Chart"
) -> Dict[str, Any]:
    """
    Generate interactive line chart data with multiple series.
    
    Args:
        labels: X-axis labels (e.g., ["Mon", "Tue", "Wed", "Thu", "Fri"])
        datasets: List of dataset objects, each with:
            - label: Series name (e.g., "Sales")
            - data: List of values
            - color: Optional line color (defaults will be applied)
        title: Chart title
        
    Example:
        generate_line_chart(
            labels=["Jan", "Feb", "Mar"],
            datasets=[
                {"label": "2023", "data": [10, 20, 30]},
                {"label": "2024", "data": [15, 25, 35]}
            ],
            title="Monthly Revenue"
        )
        
    Returns:
        Structured chart data that the UI can render as an interactive line chart.
    """
    colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]
    
    formatted_datasets = []
    for i, ds in enumerate(datasets):
        color = ds.get("color", colors[i % len(colors)])
        formatted_datasets.append({
            "label": ds.get("label", f"Series {i+1}"),
            "data": ds.get("data", []),
            "borderColor": color,
            "backgroundColor": color + "33",  # Add transparency
            "fill": ds.get("fill", False),
            "tension": 0.3,  # Smooth lines
        })
    
    data = {
        "labels": labels,
        "datasets": formatted_datasets
    }
    
    options = {
        "responsive": True,
        "plugins": {
            "legend": {"display": True},
            "tooltip": {"mode": "index", "intersect": False}
        },
        "scales": {
            "y": {"beginAtZero": True}
        }
    }
    
    return _create_chart_response(CHART_LINE, title, data, options)


@mcp.tool()
def generate_doughnut_chart(
    labels: List[str],
    values: List[float],
    title: str = "Doughnut Chart",
    colors: Optional[List[str]] = None,
    cutout: str = "60%"
) -> Dict[str, Any]:
    """
    Generate interactive doughnut chart (pie with hole) data.
    
    Args:
        labels: List of labels for each segment
        values: List of numeric values
        title: Chart title
        colors: Optional list of hex colors
        cutout: Size of center hole (e.g., "60%", "70%")
        
    Returns:
        Structured chart data that the UI can render as an interactive doughnut chart.
    """
    if len(labels) != len(values):
        return {"error": "Labels and values must have the same length"}
    
    default_colors = [
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
        "#FF9F40", "#E7E9ED", "#7C4DFF", "#00E676", "#FF5252"
    ]
    
    chart_colors = colors or default_colors[:len(labels)]
    
    data = {
        "labels": labels,
        "datasets": [{
            "data": values,
            "backgroundColor": chart_colors,
            "borderColor": ["#ffffff"] * len(labels),
            "borderWidth": 2,
        }]
    }
    
    options = {
        "responsive": True,
        "cutout": cutout,
        "plugins": {
            "legend": {"position": "right"},
            "tooltip": {"enabled": True}
        }
    }
    
    return _create_chart_response(CHART_DOUGHNUT, title, data, options)


@mcp.tool()
def generate_comparison_chart(
    categories: List[str],
    group_a_values: List[float],
    group_b_values: List[float],
    group_a_label: str = "Group A",
    group_b_label: str = "Group B",
    title: str = "Comparison Chart",
    colors: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generate a grouped bar chart for comparing two datasets.
    
    Args:
        categories: List of category labels (e.g., ["Q1", "Q2", "Q3", "Q4"])
        group_a_values: Values for first group
        group_b_values: Values for second group
        group_a_label: Label for first group
        group_b_label: Label for second group
        title: Chart title
        colors: Optional [color_a, color_b] list
        
    Returns:
        Structured chart data for a grouped comparison bar chart.
    """
    if len(categories) != len(group_a_values) or len(categories) != len(group_b_values):
        return {"error": "All arrays must have the same length"}
    
    default_colors = ["#36A2EB", "#FF6384"]
    chart_colors = colors or default_colors
    
    data = {
        "labels": categories,
        "datasets": [
            {
                "label": group_a_label,
                "data": group_a_values,
                "backgroundColor": chart_colors[0],
                "borderColor": chart_colors[0],
                "borderWidth": 1,
            },
            {
                "label": group_b_label,
                "data": group_b_values,
                "backgroundColor": chart_colors[1],
                "borderColor": chart_colors[1],
                "borderWidth": 1,
            }
        ]
    }
    
    options = {
        "responsive": True,
        "plugins": {
            "legend": {"display": True},
            "tooltip": {"enabled": True}
        },
        "scales": {
            "y": {"beginAtZero": True}
        }
    }
    
    return _create_chart_response(CHART_BAR, title, data, options)
