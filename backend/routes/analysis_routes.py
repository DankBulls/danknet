from flask import Blueprint, jsonify, request
from datetime import datetime
from services.movement_pattern_service import MovementPatternService
from services.environmental_analysis_service import EnvironmentalAnalysisService
from services.animal_behavior_service import AnimalBehaviorService

analysis_blueprint = Blueprint('analysis', __name__)
movement_service = MovementPatternService()
environmental_service = EnvironmentalAnalysisService()
behavior_service = AnimalBehaviorService()

@analysis_blueprint.route('/api/analysis/movement', methods=['GET'])
def analyze_movement():
    """Get movement pattern analysis"""
    try:
        animal_type = request.args.get('animal_type', 'elk')
        gmu_id = request.args.get('gmu_id')
        date_str = request.args.get('date')
        
        if not gmu_id:
            return jsonify({"error": "GMU ID is required"}), 400
            
        date = datetime.fromisoformat(date_str) if date_str else datetime.now()
        
        patterns = movement_service.predict_movement_patterns(
            animal_type, gmu_id, date
        )
        return jsonify(patterns)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analysis_blueprint.route('/api/analysis/daily-pattern', methods=['GET'])
def analyze_daily_pattern():
    """Get daily movement pattern analysis"""
    try:
        animal_type = request.args.get('animal_type', 'elk')
        gmu_id = request.args.get('gmu_id')
        date_str = request.args.get('date')
        
        if not gmu_id:
            return jsonify({"error": "GMU ID is required"}), 400
            
        date = datetime.fromisoformat(date_str) if date_str else datetime.now()
        
        patterns = movement_service.predict_daily_pattern(
            animal_type, gmu_id, date
        )
        return jsonify(patterns)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analysis_blueprint.route('/api/analysis/environment', methods=['GET'])
def analyze_environment():
    """Get environmental analysis"""
    try:
        gmu_id = request.args.get('gmu_id')
        date_str = request.args.get('date')
        
        if not gmu_id:
            return jsonify({"error": "GMU ID is required"}), 400
            
        date = datetime.fromisoformat(date_str) if date_str else datetime.now()
        
        analysis = environmental_service.analyze_environment(gmu_id, date)
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analysis_blueprint.route('/api/analysis/optimal-times', methods=['GET'])
def get_optimal_times():
    """Get optimal hunting times"""
    try:
        gmu_id = request.args.get('gmu_id')
        date_str = request.args.get('date')
        days = int(request.args.get('days', 5))
        
        if not gmu_id:
            return jsonify({"error": "GMU ID is required"}), 400
            
        date = datetime.fromisoformat(date_str) if date_str else datetime.now()
        
        optimal_times = environmental_service.get_optimal_times(
            gmu_id, date, days
        )
        return jsonify(optimal_times)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@analysis_blueprint.route('/api/analysis/behavior', methods=['GET'])
def analyze_behavior():
    """Get animal behavior analysis"""
    try:
        animal_type = request.args.get('animal_type', 'elk')
        date_str = request.args.get('date')
        elevation = float(request.args.get('elevation', 2000))
        
        date = datetime.fromisoformat(date_str) if date_str else datetime.now()
        
        factors = behavior_service.get_behavior_factors(
            animal_type, date, elevation
        )
        return jsonify(factors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
