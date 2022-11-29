<?php  
ini_set("display_errors", "On");//打开错误提示
ini_set("error_reporting",E_ALL);//显示所有错误
header('Access-Control-Allow-Origin: *');

$id = $_POST['id'];
$type = $_POST['type'];
$file = './books/'.$id.'.json';
switch($type){
    case 'sync':
        if(file_exists($file)){
            echoJson(json_decode(file_get_contents($file)));
        }
        break;

    case 'upload':
        if($_POST['data']){
            if(!is_dir('./books/')){
                mkdir('./books/');
            }
            file_put_contents($file, json_encode($_POST['data']));
            echoJson(['code' => 'ok', 'msg' => '上传成功!']);
        }
        break;
}

function echoJson($data){
    echo json_encode($data);
}

?>