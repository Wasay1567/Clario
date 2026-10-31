package com.Clario.app.monitoring

import android.content.Context
import android.provider.ContactsContract
import android.provider.Settings
import android.text.TextUtils
import android.net.Uri

object SenderTrustChecker {
    fun isKnownContact(context: Context, sender: String): Boolean {
        if (sender.isBlank()) return false
        val resolver = context.contentResolver
        val phoneUri = Uri.withAppendedPath(
            ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
            Uri.encode(sender)
        )
        resolver.query(
            phoneUri,
            arrayOf(ContactsContract.PhoneLookup._ID),
            null,
            null,
            null
        )?.use { cursor ->
            return cursor.moveToFirst()
        }

        resolver.query(
            ContactsContract.Contacts.CONTENT_URI,
            arrayOf(ContactsContract.Contacts._ID),
            "${ContactsContract.Contacts.DISPLAY_NAME_PRIMARY} = ?",
            arrayOf(sender),
            null
        )?.use { cursor ->
            return cursor.moveToFirst()
        }
        return false
    }

    fun hasNotificationAccess(context: Context): Boolean {
        val enabled = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
            ?: return false
        return enabled.split(":").any { component ->
            component.contains(context.packageName, ignoreCase = true)
        }
    }
}
