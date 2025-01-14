from flask import Blueprint, jsonify, request
from services.gmu_service import GMUService
from services.gmu_analysis_service import GMUAnalysisService

gmu_blueprint = Blueprint('gmu', __name__)
gmu_service = GMUService()
gmu_analysis_service = GMUAnalysisService()

@gmu_blueprint.route('/api/gmu/list', methods=['GET'])
def list_gmus():
    region = request.args.get('region')
    if region:
        gmus = gmu_service.get_gmus_by_region(region)
    else:
        gmus = gmu_service.get_all_gmus()
    return jsonify(gmus)

@gmu_blueprint.route('/api/gmu/<gmu_id>', methods=['GET'])
def get_gmu(gmu_id):
    bounds = gmu_service.get_gmu_bounds(gmu_id)
    if not bounds:
        return jsonify({"error": "GMU not found"}), 404
    return jsonify(bounds)

@gmu_blueprint.route('/api/gmu/<gmu_id>/analysis', methods=['GET'])
def analyze_gmu(gmu_id):
    """Get comprehensive GMU analysis including predictions and insights"""
    analysis = gmu_analysis_service.analyze_gmu(gmu_id)
    return jsonify(analysis)

@gmu_blueprint.route('/api/gmu/location', methods=['GET'])
def get_gmu_by_location():
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid coordinates"}), 400
        
    gmu = gmu_service.get_gmu_by_location(lat, lon)
    if not gmu:
        return jsonify({"error": "No GMU found at location"}), 404
    return jsonify(gmu)
