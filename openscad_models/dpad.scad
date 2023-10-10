$dpad_width = 7.2;
$dad_length = 6.8;
$dpad_depth = 9;

$dpad_span = ($dad_length * 2) + $dpad_width;


module plus(){
  minkowski(){
  difference(){
  union(){
    cube([$dpad_width - 1, $dpad_span - 1, $dpad_depth - 1], center=true);
    cube([$dpad_span - 1, $dpad_width - 1, $dpad_depth - 1], center=true);
  }
  translate([0,0,($dpad_depth + 1) / 2])
    scale([1,1,0.1])
      #sphere(d = $dpad_span * 2);
  }
      sphere(r=0.5, $fn = 24);
  }
}

module ring(){
  translate([0,0,-($dpad_depth / 2) + 0.5])
  cylinder(h=1, r=($dpad_span + 2) / 2, center=true);
}

difference(){
  union(){
    plus();
    ring();
  }
  

}
