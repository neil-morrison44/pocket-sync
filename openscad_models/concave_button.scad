$face_button_radius = 8.4 / 2;
$button_depth = 9;


module button(){
  difference(){
  cylinder(h=$button_depth, r = $face_button_radius, center= true, $fn=24);
  translate([0,0,($button_depth / 2)])
    scale([0.9,0.9,0.08])
      sphere(r=$face_button_radius, $fn=24);
  }
}


button();
