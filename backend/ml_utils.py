import os
from PIL import Image
import math
import numpy as np
from mrcnn import model as modellib
from mrcnn.config import Config

class FoodConfig(Config):
    NAME = "Food"
    GPU_COUNT = 1
    IMAGES_PER_GPU = 1
    RPN_NMS_THRESHOLD = 0.7
    BACKBONE = "resnet101"
    COMPUTE_BACKBONE_SHAPE = None
    BACKBONE_STRIDES = [4, 8, 16, 32, 64]
    FPN_CLASSIF_FC_LAYERS_SIZE = 1024
    TOP_DOWN_PYRAMID_SIZE = 256
    RPN_ANCHOR_RATIOS = [0.5, 1, 2]
    RPN_ANCHOR_STRIDE = 1
    RPN_TRAIN_ANCHORS_PER_IMAGE = 256
    PRE_NMS_LIMIT = 6000
    POST_NMS_ROIS_TRAINING = 2000
    POST_NMS_ROIS_INFERENCE = 1000
    USE_MINI_MASK = True
    MINI_MASK_SHAPE = (56, 56)
    IMAGE_MIN_SCALE = 0
    IMAGE_CHANNEL_COUNT = 3
    MEAN_PIXEL = np.array([123.7, 116.8, 103.9])
    ROI_POSITIVE_RATIO = 0.33
    POOL_SIZE = 7
    MASK_POOL_SIZE = 14
    MASK_SHAPE = [28, 28]
    RPN_BBOX_STD_DEV = np.array([0.1, 0.1, 0.2, 0.2])
    BBOX_STD_DEV = np.array([0.1, 0.1, 0.2, 0.2])
    DETECTION_MIN_CONFIDENCE = 0.7
    DETECTION_NMS_THRESHOLD = 0.3
    LEARNING_RATE = 0.0001
    LEARNING_MOMENTUM = 0.9
    WEIGHT_DECAY = 0.0001
    LOSS_WEIGHTS = {
        "rpn_class_loss": 100.,
        "rpn_bbox_loss": 1.,
        "mrcnn_class_loss": 5.,
        "mrcnn_bbox_loss": 1.,
        "mrcnn_mask_loss": 1.
    }
    USE_RPN_ROIS = True
    TRAIN_BN = False
    GRADIENT_CLIP_NORM = 5.0
    IMAGE_RESIZE_MODE = "square"
    IMAGE_MIN_DIM = 612
    IMAGE_MAX_DIM = 960
    NUM_CLASSES = 21
    RPN_ANCHOR_SCALES = (32, 64, 128, 256, 512)
    TRAIN_ROIS_PER_IMAGE = 32
    STEPS_PER_EPOCH = 2000
    VALIDATION_STEPS = 50
    MAX_GT_INSTANCES = 5
    DETECTION_MAX_INSTANCES = 20

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(ROOT_DIR, "logs")

FOOD_TYPES = ['BG', 'apple', 'orange', 'plum', 'banana', 'lemon', 'sachima',
                'bread', 'peach', 'qiwi', 'tomato', 'grape', 'egg', 'litchi',
                'bun', 'doughnut', 'fired_dough_twist', 'mango', 'mooncake', 
                'pear', 'coin']

FOOD_UNIT_CALORIE = { 
  'apple' : 0.456, 'banana' : 0.8099, 'bread' : 0.567, 'bun' : 0.7582,
  'doughnut' : 1.3454, 'egg' : 1.6729, 'fired_dough_twist' : 14.0128,
  'grape' : 0.6693, 'lemon' : 0.2784, 'litchi' : 0.66, 'mango' : 0.642,
  'mooncake' : 18.0768, 'orange' : 0.35, 'peach' : 0.5472, 'pear' : 0.3978,
  'plum' : 0.4646, 'qiwi' : 0.5917, 'sachima' : 4.719, 'tomato' : 0.2646 
}

FOOD_VOLUME_FACTOR = { 
  'apple' : 17, 'banana' : 10, 'bread' : 10, 'bun' : 10,
  'doughnut' : 10, 'egg' : 12, 'fired_dough_twist' : 10,
  'grape' : 10, 'lemon' : 10, 'litchi' : 10, 'mango' : 10,
  'mooncake' : 10, 'orange' : 12, 'peach' : 10, 'pear' : 10,
  'plum' : 10, 'qiwi' : 10, 'sachima' : 10, 'tomato' : 16 
}

def load_model():
    inference_config = FoodConfig()
    model_path = os.path.join(ROOT_DIR, "mask_rcnn_food.h5")
    inf_model = modellib.MaskRCNN(mode="inference", 
                                  config=inference_config,
                                  model_dir=MODEL_DIR)
    print("Loading weights from ", model_path)
    inf_model.load_weights(model_path, by_name=True)
    
    # Run a dummy prediction to initialize the graph properly for multi-threading
    dummy_image = np.zeros((612, 612, 3), dtype=np.uint8)
    inf_model.detect([dummy_image], verbose=0)
    
    return inf_model

def get_pixel_areas(results):
    food_class_out = None
    coin_pixels = 0
    food_pixels = 0
    food_score = 0.0
    
    if 'scores' not in results:
        scores = [0.0] * len(results['class_ids'])
    else:
        scores = results['scores']
        
    for idx, (class_id, mask, score) in enumerate(zip(results['class_ids'], results['masks'].transpose(2, 0, 1), scores)):
        class_name = FOOD_TYPES[class_id]
        if class_name == 'coin':
            coin_pixels = np.sum(mask)
        elif class_name != 'BG':
            # Only update if this detection has a higher confidence score
            if float(score) > food_score:
                food_class_out = class_name
                food_pixels = np.sum(mask)
                food_score = float(score)
            
    return food_class_out, coin_pixels, food_pixels, food_score

def predict_calories(inf_model, top_image_path, side_image_path):
    with Image.open(top_image_path) as img:
        img = img.convert('RGB')
        arr_top = np.array(img)
        image_area_top = arr_top.shape[0] * arr_top.shape[1]
    results_top = inf_model.detect([arr_top], verbose=0)[0]
    
    with Image.open(side_image_path) as img:
        img = img.convert('RGB')
        arr_side = np.array(img)
        image_area_side = arr_side.shape[0] * arr_side.shape[1]
    results_side = inf_model.detect([arr_side], verbose=0)[0]
    
    _, coin_top_pixels, food_top_pixels, _ = get_pixel_areas(results_top)
    food_class_name, coin_side_pixels, food_side_pixels, food_score = get_pixel_areas(results_side)
    
    # Debug: log what was detected
    print(f"[DEBUG] Top image:  food_pixels={food_top_pixels}, coin_pixels={coin_top_pixels}, image_area={image_area_top}")
    print(f"[DEBUG] Side image: food_class={food_class_name}, food_pixels={food_side_pixels}, coin_pixels={coin_side_pixels}, score={food_score:.2f}, image_area={image_area_side}")

    if not food_class_name:
        food_class_name, _, _, food_score = get_pixel_areas(results_top)
        
    if not food_class_name or food_class_name not in FOOD_UNIT_CALORIE:
        raise ValueError("No valid food item detected in the image.")
        
    coin_real_area = 19.625  # reference area of the calibration coin

    # If coin not detected in an image, fall back to a default assumed coin pixel size.
    # Default assumes the coin covers ~1.2% of a typical phone image (tuned empirically).
    DEFAULT_COIN_PIXELS_TOP  = max(1, int(image_area_top  * 0.012))
    DEFAULT_COIN_PIXELS_SIDE = max(1, int(image_area_side * 0.012))

    effective_coin_top  = coin_top_pixels  if coin_top_pixels  > 0 else DEFAULT_COIN_PIXELS_TOP
    effective_coin_side = coin_side_pixels if coin_side_pixels > 0 else DEFAULT_COIN_PIXELS_SIDE
    
    coin_detected = (coin_top_pixels > 0 or coin_side_pixels > 0)
    if not coin_detected:
        print("[DEBUG] No coin detected in either image — using default pixel scale for estimation.")

    # Calculate volume from both views
    areas = []
    if food_top_pixels > 0:
        food_top_area = coin_real_area * food_top_pixels / effective_coin_top
        radius_top = math.sqrt(food_top_area / math.pi)
        areas.append((4/3) * math.pi * radius_top**3)
    
    if food_side_pixels > 0:
        food_side_area = coin_real_area * food_side_pixels / effective_coin_side
        radius_side = math.sqrt(food_side_area / math.pi)
        areas.append((4/3) * math.pi * radius_side**3)
    
    if not areas:
        raise ValueError("Food item not detected clearly in the provided images. Please retake photos.")
    
    threshold = FOOD_VOLUME_FACTOR.get(food_class_name, 10)
    avg_volume = sum(areas) / len(areas)
    avg_volume /= threshold
    
    calories = avg_volume * FOOD_UNIT_CALORIE[food_class_name]
    
    return {
        "food_item": food_class_name,
        "volume_cm3": round(avg_volume, 2),
        "calories": round(calories, 2),
        "confidence_score": round(food_score, 2),
        "coin_detected": coin_detected
    }
