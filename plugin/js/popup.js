function clickSave() {
    localStorage['ServerIP'] = $('#I_ServerIP').html();
    $('#C_IconEdit').show();
    $('#C_IconSave').hide();
    $('#I_ServerIP').attr('contentEditable', 'false');
    $('#I_ServerIP').css('color', 'blue');
}

function clickEdit() {
    $('#C_IconEdit').hide();
    $('#C_IconSave').show();
    $('#I_ServerIP').attr('contentEditable', 'true');
    $('#I_ServerIP').focus();
    $('#I_ServerIP').css('color', 'red');
}

function init() {
    $('#I_ServerIP').html(localStorage['ServerIP']);
    $('#C_IconEdit').show();
    $('#C_IconSave').hide();
    $('#C_IconEdit').click(clickEdit);
    $('#C_IconSave').click(clickSave);
}

window.onload = init;