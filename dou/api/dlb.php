<?php  
ini_set("display_errors", "On");//打开错误提示
ini_set("error_reporting",E_ALL);//显示所有错误
header('Access-Control-Allow-Origin: *');

$id = $_POST['id'];
$name = $_POST['name'];
$type = $_POST['type'];
$json = file_exists('dlb.json') ? json_decode(file_get_contents('dlb.json'), true) : [];
switch($type){
    case 'list':
        echoJson($json);
        break;

    case 'upload':
        if($_POST['data']){
           $json[$id] = $_POST['data'];
           $json[$id]['name'] = $name;
           saveJson($json);
          echoJson(['code' => 'ok', 'msg' => '上传成功!']);
        }
        break;
}

function echoJson($data){
    echo json_encode($data);
}

function saveJson($data){
        file_put_contents('dlb.json', json_encode($data));
}

?>