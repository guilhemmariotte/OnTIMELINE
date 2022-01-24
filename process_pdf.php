<?php
if( isset($_POST) ){
    
    // Get the LaTeX file content from the front
    $data = $_POST["data"];
	//$data = urlencode($data);
    $data = str_replace("PLUS", "+", $data); // decode the plus sign
    //$data = urldecode($data);
	//$data = "yeaaah";
    echo "result: {$data}";
    
    // Update the LaTeX file with this content
    if(!empty($data)){
        $file = fopen("main.tex", "w");
		fwrite($file, $data);
		fclose($file);
    }
    
}
?>