<?php  
// ini_set("display_errors", "On");//打开错误提示
// ini_set("error_reporting",E_ALL);//显示所有错误
header('Access-Control-Allow-Origin: *');

$id = $_POST['id'];
if(empty($id)){
    return;
}
$type = $_POST['type'];
$json = file_exists('user.json') ? json_decode(file_get_contents('user.json'), true) : [];
switch($type){
    case 'profile':
        $name = $_POST['name'];
        if(empty($name)){
            $name = $id;
        }
        $icon = $_POST['icon'];

        if(strpos($icon, 'data:') == 0){ // base64
            if(!is_dir('./icon/')){
                mkdir('./icon/');
            }
            $saveTo = './icon/'.$id.'.jpg';
            imgBase64ToFile($saveTo, $icon);
            $icon = $saveTo;
        }

        $json[$id] = ['name' => $name, 'icon' => $icon];
        saveJson($json);
        echoJson(['code' => 'ok', 'msg' => '更新用户数据成功!']);
        break;

    case 'sync':
        $equal = isset($json[$id]) && isset($json[$id]['md5']) && $json[$id]['md5'] == $_POST['md5'];
        echoJson(['code' => 'ok', 'msg' => $equal ? '没有更新' : file_get_contents('./datas/'.$id.'.json')]);
        break;

    case 'upload':
        if(!is_dir('./datas/')){
            mkdir('./datas/');
        }
        $data = json_encode($_POST['data']);
        if(!isset($json[$id])){
            $json[$id] = ['name' => $id, 'icon' => ''];
        }
        $json[$id]['md5'] = $_POST['md5'];
        file_put_contents('./datas/'.$id.'.json', $data);
        saveJson($json);
        echoJson(['code' => 'ok', 'msg' => '上传成功!']);
        break;
}

 function imgBase64ToFile($saveTo, $str) {
        /* 通过正则匹配得到 base64 头信息和图片信息等 */
        $pregInfo = preg_match('/^(data:\s*image\/(\w+);base64,)/', $str, $photoInfo);
        $result = false;
        /* 匹配到结果则开始处理 */
        if ($pregInfo != false) {
            /* 去除base64头：data:image/jpeg;base64,这部分的内容需要去掉，不然 base64_decode 出来的图片是损坏的 */
            $clearBase64HeadWithPhoto = str_replace($photoInfo[1], '', $str);
            $clearBase64HeadWithPhoto = str_replace(' ', '+', $clearBase64HeadWithPhoto);
            /* base64_decode base64编码，重新得到图片的内容 */
            $photoFileSource = base64_decode($clearBase64HeadWithPhoto);
            /* 写文件 */
            $file = file_put_contents($saveTo, $photoFileSource);
            return true;
        }
    }


function echoJson($data){
    echo json_encode($data);
}

function saveJson($data){
        file_put_contents('user.json', json_encode($data));

}

?>